import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UserRole } from '../users/user.entity';
import { AvailabilitySlot, SlotStatus } from '../scheduling/availability-slot.entity';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { WeeklyScheduleOwnerType } from '../scheduling/weekly-schedule.entity';
import { DoctorProfile, DoctorProfileStatus } from '../doctors/doctor-profile.entity';
import { User } from '../users/user.entity';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { AppointmentStatusHistory } from './appointment-status-history.entity';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { Notification, NotificationType } from '../notifications/notification.entity';
import { AppointmentReminder, ReminderStatus } from '../notifications/appointment-reminder.entity';
import { DoctorSubscription, DoctorSubscriptionStatus } from '../subscriptions/subscription.entity';

// Appointment attendance is day-based in Iraq (Asia/Baghdad, UTC+3), not tied
// to the internal capacity slot selected by the system.
function baghdadDayBounds(value: Date): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(value);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const start = new Date(Date.UTC(get('year'), get('month') - 1, get('day')) - 3 * 60 * 60 * 1000);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private readonly repo: Repository<Appointment>,
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(DoctorProfile) private readonly profilesRepo: Repository<DoctorProfile>,
  ) {}

  /** Resolve a public profile identifier server-side; never expose the doctor's account UUID to patients. */
  async createFromProfile(dto: CreateAppointmentDto, key: string, bookerId: string) {
    if (!dto.doctorProfileId) throw new BadRequestException('حدد ملف الطبيب المطلوب');
    const profile = await this.profilesRepo.findOne({ where: { id: dto.doctorProfileId, status: DoctorProfileStatus.APPROVED } });
    if (!profile) throw new ConflictException('الطبيب غير متاح للحجز حالياً');
    if (dto.doctorId && dto.doctorId !== profile.userId) throw new BadRequestException('بيانات الطبيب غير متطابقة');
    const { doctorProfileId: _profileId, ...booking } = dto;
    return this.create({ ...booking, doctorId: profile.userId }, key, bookerId);
  }

  /**
   * Booking is serialized on the doctor's exact availability row. PostgreSQL's
   * exclusion constraint remains the final protection against overlapping
   * confirmed appointments, including requests arriving through other paths.
   */
  async create(dto: CreateAppointmentDto, key: string, bookerId: string) {
    const start = new Date(dto.startsAt);
    const end = new Date(dto.endsAt);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      throw new BadRequestException('وقت النهاية يجب أن يكون بعد البداية');
    }
    if (start <= new Date()) throw new BadRequestException('لا يمكن الحجز في وقت سابق');
    if (!dto.beneficiaryId && !dto.beneficiaryName?.trim()) throw new BadRequestException('أدخل اسم الشخص الذي تحجز له');
    if (dto.beneficiaryId && (dto.beneficiaryName || dto.beneficiaryPhone)) throw new BadRequestException('اختر مستفيداً مسجلاً أو أدخل بيانات مستفيد آخر');

    const existing = await this.repo.findOne({ where: { idempotencyKey: key } });
    if (existing) return this.replayOrConflict(existing, dto, start, end, bookerId);

    try {
      return await this.dataSource.transaction('READ COMMITTED', async (manager) => {
        const appointments = manager.getRepository(Appointment);
        const slots = manager.getRepository(AvailabilitySlot);
        const doctors = manager.getRepository(DoctorProfile);
        const history = manager.getRepository(AppointmentStatusHistory);

        // Lock the exact slot. Concurrent requests for it wait, then re-check status.
        const slot = await slots.createQueryBuilder('slot')
          .setLock('pessimistic_write')
          .where('slot."doctorId" = :doctorId', { doctorId: dto.doctorId })
          .andWhere('slot."startsAt" = :start AND slot."endsAt" = :end', { start, end })
          .getOne();
        if (!slot || slot.status !== SlotStatus.OPEN) {
          throw new ConflictException('هذا الموعد غير متاح أو تم حجزه مسبقاً');
        }

        const profile = await doctors.findOne({ where: { userId: dto.doctorId, status: DoctorProfileStatus.APPROVED } });
        if (!profile) throw new ConflictException('الطبيب غير متاح للحجز حالياً');
        const subscription = await manager.getRepository(DoctorSubscription).findOne({ where: { doctorId: dto.doctorId, status: DoctorSubscriptionStatus.ACTIVE } });
        if (!subscription || !subscription.expiresAt || subscription.expiresAt <= new Date()) {
          throw new ConflictException('اشتراك الطبيب منتهٍ أو غير مفعل؛ يمكن مشاهدة ملفه لكن الحجز غير متاح حالياً');
        }

        const replay = await appointments.findOne({ where: { idempotencyKey: key } });
        if (replay) return this.replayOrConflict(replay, dto, start, end, bookerId);

        const entity = appointments.create({
          doctorId: dto.doctorId,
          beneficiaryId: dto.beneficiaryId ?? null,
          beneficiaryName: dto.beneficiaryName?.trim() ?? null,
          beneficiaryPhone: dto.beneficiaryPhone?.trim() ?? null,
          bookedByUserId: bookerId,
          startsAt: start,
          endsAt: end,
          status: AppointmentStatus.CONFIRMED,
          idempotencyKey: key,
          patientNote: dto.patientNote ?? null,
        });
        const saved = await appointments.save(entity);
        await history.save(history.create({ appointmentId: saved.id, fromStatus: null, toStatus: AppointmentStatus.CONFIRMED, changedByUserId: bookerId, changedByRole: UserRole.PATIENT, reason: 'إنشاء الحجز' }));
        slot.status = SlotStatus.CLOSED;
        await slots.save(slot);
        const recipientIds = [...new Set([saved.doctorId, saved.bookedByUserId, saved.beneficiaryId].filter((id): id is string => !!id))];
        const notifications = manager.getRepository(Notification);
        const notificationRows = recipientIds.map((userId) => notifications.create({
          userId, appointmentId: saved.id, type: NotificationType.APPOINTMENT_BOOKED,
          title: userId === saved.doctorId ? 'حجز جديد' : 'تم تأكيد الحجز',
          body: userId === saved.doctorId ? 'لديك حجز جديد في جدول مواعيدك.' : 'تم تسجيل حجز موعدك بنجاح.',
          data: { appointmentId: saved.id, startsAt: saved.startsAt.toISOString(), endsAt: saved.endsAt.toISOString() },
        }));
        await notifications.save(notificationRows);

        // Day-based bookings intentionally do not schedule clock-time reminders.
        return saved;
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error as any).driverError?.code;
        if (code === '23P01' || code === '23505') {
          const replay = await this.repo.findOne({ where: { idempotencyKey: key } });
          if (replay) return this.replayOrConflict(replay, dto, start, end, bookerId);
          throw new ConflictException('الموعد متعارض أو محجوز مسبقاً');
        }
        if (code === '23503') throw new BadRequestException('تحقق من الطبيب أو المستفيد المحدد');
      }
      throw error;
    }
  }

  private replayOrConflict(
    appointment: Appointment, dto: CreateAppointmentDto, start: Date, end: Date, bookerId: string,
  ) {
    const sameRequest = appointment.bookedByUserId === bookerId
      && appointment.doctorId === dto.doctorId
      && appointment.beneficiaryId === (dto.beneficiaryId ?? null)
      && appointment.beneficiaryName === (dto.beneficiaryName?.trim() ?? null)
      && appointment.beneficiaryPhone === (dto.beneficiaryPhone?.trim() ?? null)
      && appointment.startsAt.getTime() === start.getTime()
      && appointment.endsAt.getTime() === end.getTime();
    if (!sameRequest) throw new ConflictException('مفتاح الطلب مستخدم لعملية حجز مختلفة');
    return appointment;
  }


  /** Lists only records the authenticated patient or doctor is entitled to see. */
  async listForUser(user: { sub: string; role: UserRole }, filters: ListAppointmentsDto) {
    if (user.role !== UserRole.PATIENT && user.role !== UserRole.DOCTOR) {
      throw new ForbiddenException('هذه القائمة متاحة للمريض أو الطبيب فقط');
    }
    if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
      throw new BadRequestException('تاريخ البداية يجب أن يسبق تاريخ النهاية');
    }

    const qb = this.repo.createQueryBuilder('a');
    if (user.role === UserRole.PATIENT) {
      qb.where('(a."bookedByUserId" = :userId OR a."beneficiaryId" = :userId)', { userId: user.sub });
    } else {
      qb.where('a."doctorId" = :userId', { userId: user.sub });
    }
    if (filters.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters.from) qb.andWhere('a."startsAt" >= :from', { from: new Date(filters.from) });
    if (filters.to) qb.andWhere('a."startsAt" <= :to', { to: new Date(filters.to) });

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    qb.orderBy('a."startsAt"', 'DESC').addOrderBy('a."createdAt"', 'DESC')
      .skip((page - 1) * limit).take(limit);
    const [appointments, total] = await qb.getManyAndCount();

    const doctorIds = [...new Set(appointments.map((a) => a.doctorId))];
    const beneficiaryIds = [...new Set(appointments.map((a) => a.beneficiaryId).filter((id): id is string => !!id))];
    // The doctor needs the actual beneficiary's contact details and the identity
    // of the account that placed a booking for someone else. Keep these fields
    // out of patient responses to avoid exposing another user's contact data.
    const bookerIds = user.role === UserRole.DOCTOR
      ? [...new Set(appointments.map((a) => a.bookedByUserId))] : [];
    const [profiles, beneficiaries, bookers] = await Promise.all([
      doctorIds.length ? this.profilesRepo.find({ where: doctorIds.map((userId) => ({ userId })) }) : [],
      beneficiaryIds.length ? this.usersRepo.find({ where: beneficiaryIds.map((id) => ({ id })) }) : [],
      bookerIds.length ? this.usersRepo.find({ where: bookerIds.map((id) => ({ id })) }) : [],
    ]);
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));
    const beneficiaryById = new Map(beneficiaries.map((u) => [u.id, u]));
    const bookerById = new Map(bookers.map((u) => [u.id, u]));

    return {
      items: appointments.map((a) => {
        const profile = profileByUser.get(a.doctorId);
        const beneficiary = a.beneficiaryId ? beneficiaryById.get(a.beneficiaryId) : undefined;
        return {
          id: a.id,
          status: a.status,
          startsAt: a.startsAt,
          endsAt: a.endsAt,
          patientNote: a.patientNote,
          createdAt: a.createdAt,
          canMessage: (user.role === UserRole.PATIENT && a.bookedByUserId === user.sub) || (user.role === UserRole.DOCTOR && a.doctorId === user.sub),
          canCancel: user.role === UserRole.PATIENT && a.bookedByUserId === user.sub
            && a.status === AppointmentStatus.CONFIRMED && baghdadDayBounds(a.startsAt).start.getTime() > Date.now(),
          doctor: profile ? {
            userId: profile.userId,
            fullName: profile.fullName,
            specialty: profile.specialty,
            clinicName: profile.clinicName,
            address: profile.address,
            city: profile.city,
            photoUrl: profile.photoUrl,
          } : { userId: a.doctorId },
          beneficiary: beneficiary ? {
            userId: beneficiary.id, displayName: beneficiary.displayName,
            ...(user.role === UserRole.DOCTOR ? { phone: beneficiary.phone } : {}),
          } : { userId: a.beneficiaryId, displayName: a.beneficiaryName, ...(user.role === UserRole.DOCTOR ? { phone: a.beneficiaryPhone } : {}) },
          ...(user.role === UserRole.DOCTOR ? {
            bookedBy: (() => { const booker = bookerById.get(a.bookedByUserId); return booker ? { displayName: booker.displayName } : { displayName: 'مستخدم التطبيق' }; })(),
          } : {}),
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user: { sub: string; role: UserRole }) {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('الحجز غير موجود');
    if (user.role !== UserRole.OWNER && user.sub !== appointment.bookedByUserId
      && user.sub !== appointment.beneficiaryId && user.sub !== appointment.doctorId) {
      throw new ForbiddenException('ليس لديك صلاحية الاطلاع على هذا الحجز');
    }
    const [profile, beneficiary, booker, history] = await Promise.all([
      this.profilesRepo.findOne({ where: { userId: appointment.doctorId } }),
      appointment.beneficiaryId ? this.usersRepo.findOne({ where: { id: appointment.beneficiaryId } }) : Promise.resolve(null),
      this.usersRepo.findOne({ where: { id: appointment.bookedByUserId } }),
      this.dataSource.getRepository(AppointmentStatusHistory).find({ where: { appointmentId: id }, order: { createdAt: 'ASC' } }),
    ]);
    const isOwner = user.role === UserRole.OWNER;
    return {
      id: appointment.id, status: appointment.status, startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      // The owner needs operational booking metadata, not clinical notes or patient identity.
      ...(!isOwner ? { patientNote: appointment.patientNote } : {}),
      createdAt: appointment.createdAt, updatedAt: appointment.updatedAt,
      doctor: profile ? { ...(isOwner ? {} : { userId: profile.userId }), fullName: profile.fullName, specialty: profile.specialty, clinicName: profile.clinicName, address: profile.address, city: profile.city, photoUrl: profile.photoUrl } : (isOwner ? {} : { userId: appointment.doctorId }),
      ...(!isOwner ? {
        beneficiary: beneficiary ? { userId: beneficiary.id, displayName: beneficiary.displayName, ...(user.role === UserRole.DOCTOR ? { phone: beneficiary.phone } : {}) } : { userId: appointment.beneficiaryId, displayName: appointment.beneficiaryName, ...(user.role === UserRole.DOCTOR ? { phone: appointment.beneficiaryPhone } : {}) },
        bookedBy: booker ? { userId: booker.id, displayName: booker.displayName } : { userId: appointment.bookedByUserId },
      } : {}),
      statusHistory: history.map(h => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, changedByRole: h.changedByRole, ...(!isOwner ? { reason: h.reason } : {}), createdAt: h.createdAt })),
    };
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, user: { sub: string; role: UserRole }) {
    if (user.role !== UserRole.DOCTOR && user.role !== UserRole.OWNER) throw new ForbiddenException('تغيير حالة الحجز متاح للطبيب أو المالك فقط');
    if (dto.status !== AppointmentStatus.COMPLETED && dto.status !== AppointmentStatus.NO_SHOW) throw new BadRequestException('يمكن للطبيب تسجيل مكتمل أو لم يحضر من هذا المسار');
    return this.dataSource.transaction(async manager => {
      const appointments = manager.getRepository(Appointment);
      const appointment = await appointments.createQueryBuilder('a').setLock('pessimistic_write').where('a.id = :id', { id }).getOne();
      if (!appointment) throw new NotFoundException('الحجز غير موجود');
      if (user.role === UserRole.DOCTOR && appointment.doctorId !== user.sub) throw new ForbiddenException('لا يمكنك تعديل حجز طبيب آخر');
      if (appointment.status !== AppointmentStatus.CONFIRMED) throw new ConflictException('لا يمكن تغيير حالة الحجز إلا إذا كان مؤكداً');
      const day = baghdadDayBounds(appointment.startsAt);
      if (dto.status === AppointmentStatus.COMPLETED && day.start.getTime() > Date.now()) {
        throw new ConflictException('لا يمكن إكمال الموعد قبل بداية يوم المراجعة');
      }
      if (dto.status === AppointmentStatus.NO_SHOW && day.end.getTime() > Date.now()) {
        throw new ConflictException('لا يمكن تسجيل عدم الحضور قبل انتهاء يوم المراجعة بالكامل');
      }
      const previous = appointment.status;
      appointment.status = dto.status;
      const saved = await appointments.save(appointment);
      await manager.getRepository(AppointmentStatusHistory).save({ appointmentId: id, fromStatus: previous, toStatus: dto.status, changedByUserId: user.sub, changedByRole: user.role, reason: dto.reason ?? null });
      const recipients = [...new Set([appointment.bookedByUserId, appointment.beneficiaryId].filter((id): id is string => !!id))];
      const notificationRepo = manager.getRepository(Notification);
      const type = dto.status === AppointmentStatus.COMPLETED ? NotificationType.APPOINTMENT_COMPLETED : NotificationType.APPOINTMENT_NO_SHOW;
      await manager.getRepository(AppointmentReminder).createQueryBuilder().update(AppointmentReminder)
        .set({ status: ReminderStatus.SKIPPED }).where('"appointmentId" = :id AND status IN (:...statuses)', { id, statuses: [ReminderStatus.PENDING, ReminderStatus.PROCESSING] }).execute();
      await notificationRepo.save(recipients.map(userId => notificationRepo.create({
        userId, appointmentId: id, type,
        title: dto.status === AppointmentStatus.COMPLETED ? 'تم إكمال الموعد' : 'تم تسجيل عدم الحضور',
        body: dto.status === AppointmentStatus.COMPLETED ? 'تم تسجيل الموعد كمكتمل.' : 'تم تسجيل أن المريض لم يحضر الموعد.',
        data: { appointmentId: id, status: dto.status },
      })));
      return { id: saved.id, status: saved.status, startsAt: saved.startsAt, endsAt: saved.endsAt };
    });
  }

  async cancel(id: string, user: { sub: string; role: UserRole }) {
    return this.dataSource.transaction(async (manager) => {
      const appointments = manager.getRepository(Appointment);
      const appointment = await appointments.createQueryBuilder('a')
        .setLock('pessimistic_write').where('a.id = :id', { id }).getOne();
      if (!appointment) throw new NotFoundException('الحجز غير موجود');
      if (user.role !== UserRole.OWNER && user.sub !== appointment.bookedByUserId && user.sub !== appointment.doctorId) {
        throw new ForbiddenException('ليس لديك صلاحية إلغاء هذا الحجز');
      }
      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new ConflictException('لا يمكن إلغاء الحجز بحالته الحالية');
      }
      if (baghdadDayBounds(appointment.startsAt).start.getTime() <= Date.now()) {
        throw new ConflictException('لا يمكن إلغاء الحجز بعد بداية يوم المراجعة');
      }
      const previousStatus = appointment.status;
      appointment.status = AppointmentStatus.CANCELLED;
      const saved = await appointments.save(appointment);
      const slot = await manager.getRepository(AvailabilitySlot).createQueryBuilder('slot')
        .setLock('pessimistic_write')
        .where('slot.\"doctorId\" = :doctorId', { doctorId: appointment.doctorId })
        .andWhere('slot.\"startsAt\" = :start AND slot.\"endsAt\" = :end', {
          start: appointment.startsAt, end: appointment.endsAt,
        }).getOne();
      if (slot) {
        const otherConfirmed = await manager.getRepository(Appointment).createQueryBuilder('other')
          .where('other.doctorId=:doctorId AND other.id<>:appointmentId',{doctorId:appointment.doctorId,appointmentId:appointment.id})
          .andWhere('other.startsAt=:start AND other.endsAt=:end',{start:appointment.startsAt,end:appointment.endsAt})
          .andWhere('other.status=:status',{status:AppointmentStatus.CONFIRMED}).getCount();
        if (otherConfirmed===0) {
          const closure=await manager.getRepository(ScheduleException).createQueryBuilder('e').where('e.ownerType=:type AND e.ownerId=:doctorId AND e.isActive=true',{type:WeeklyScheduleOwnerType.DOCTOR,doctorId:appointment.doctorId}).andWhere('e.startsAt < :end AND e.endsAt > :start',{start:appointment.startsAt,end:appointment.endsAt}).getOne();
          slot.status = closure ? SlotStatus.CLOSED : SlotStatus.OPEN;
          await manager.getRepository(AvailabilitySlot).save(slot);
        }
      }
      await manager.getRepository(AppointmentStatusHistory).save({ appointmentId: id, fromStatus: previousStatus, toStatus: AppointmentStatus.CANCELLED, changedByUserId: user.sub, changedByRole: user.role, reason: 'إلغاء الحجز' });
      await manager.getRepository(AppointmentReminder).createQueryBuilder().update(AppointmentReminder)
        .set({ status: ReminderStatus.SKIPPED }).where('"appointmentId" = :id AND status IN (:...statuses)', { id, statuses: [ReminderStatus.PENDING, ReminderStatus.PROCESSING] }).execute();
      const recipients = [...new Set([appointment.doctorId, appointment.bookedByUserId, appointment.beneficiaryId].filter((id): id is string => !!id))].filter(id => id !== user.sub);
      const notificationRepo = manager.getRepository(Notification);
      await notificationRepo.save(recipients.map(userId => notificationRepo.create({
        userId, appointmentId: id, type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'تم إلغاء الحجز', body: 'تم إلغاء موعد طبي في تطبيق طبيبي.',
        data: { appointmentId: id, startsAt: appointment.startsAt.toISOString() },
      })));
      return saved;
    });
  }
}
