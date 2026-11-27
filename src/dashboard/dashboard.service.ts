import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { AvailabilitySlot, SlotStatus } from '../scheduling/availability-slot.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { WeeklyScheduleOwnerType } from '../scheduling/weekly-schedule.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { FacilityBooking, FacilityBookingStatus } from '../facilities/facility-booking.entity';
import { FacilityAvailabilitySlot, FacilitySlotStatus } from '../facilities/facility-slot.entity';
import { FacilityService } from '../facilities/facility-service.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(AvailabilitySlot) private readonly doctorSlots: Repository<AvailabilitySlot>,
    @InjectRepository(DoctorProfile) private readonly doctors: Repository<DoctorProfile>,
    @InjectRepository(ScheduleException) private readonly exceptions: Repository<ScheduleException>,
    @InjectRepository(MedicalFacility) private readonly facilities: Repository<MedicalFacility>,
    @InjectRepository(FacilityBooking) private readonly facilityBookings: Repository<FacilityBooking>,
    @InjectRepository(FacilityAvailabilitySlot) private readonly facilitySlots: Repository<FacilityAvailabilitySlot>,
    @InjectRepository(FacilityService) private readonly services: Repository<FacilityService>,
  ) {}

  private range(from?: string, to?: string) {
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date(start.getTime() + 7 * 86400000);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() - start.getTime() > 93 * 86400000) {
      throw new BadRequestException('حدد فترة صحيحة لا تتجاوز 93 يوماً');
    }
    return { start, end };
  }

  async doctor(userId: string, from?: string, to?: string) {
    const profile = await this.doctors.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('ملف الطبيب غير موجود');
    const { start, end } = this.range(from, to);
    const base = () => this.appointments.createQueryBuilder('a').where('a."doctorId" = :userId', { userId }).andWhere('a."startsAt" >= :start AND a."startsAt" < :end', { start, end });
    const [confirmed, cancelled, completed, noShow, upcoming, openSlots, closedSlots, activeExceptions] = await Promise.all([
      base().andWhere('a.status = :s', { s: AppointmentStatus.CONFIRMED }).getCount(),
      base().andWhere('a.status = :s', { s: AppointmentStatus.CANCELLED }).getCount(),
      base().andWhere('a.status = :s', { s: AppointmentStatus.COMPLETED }).getCount(),
      base().andWhere('a.status = :s', { s: AppointmentStatus.NO_SHOW }).getCount(),
      base().andWhere('a.status = :s', { s: AppointmentStatus.CONFIRMED }).andWhere('a."startsAt" >= :now', { now: new Date() }).orderBy('a."startsAt"', 'ASC').take(10).getMany(),
      this.doctorSlots.count({ where: { doctorId: userId, status: SlotStatus.OPEN, startsAt: MoreThanOrEqual(start), endsAt: LessThan(end) } }),
      this.doctorSlots.createQueryBuilder('s').where('s."doctorId"=:userId', { userId }).andWhere('s.status=:status', { status: SlotStatus.CLOSED }).andWhere('s."startsAt">=:start AND s."startsAt"<:end', { start, end }).getCount(),
      this.exceptions.count({ where: { ownerType: WeeklyScheduleOwnerType.DOCTOR, ownerId: userId, isActive: true } }),
    ]);
    return {
      range: { from: start.toISOString(), to: end.toISOString(), timezone: 'Asia/Baghdad' },
      doctor: { userId, fullName: profile.fullName, specialty: profile.specialty, profileStatus: profile.status },
      summary: { confirmedAppointments: confirmed, cancelledAppointments: cancelled, completedAppointments: completed, noShowAppointments: noShow, openSlots, closedSlots, activeScheduleExceptions: activeExceptions },
      upcomingAppointments: upcoming.map(a => ({ id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, beneficiaryId: a.beneficiaryId, patientNote: a.patientNote })),
      note: 'هذه بيانات ملخص لوحة الطبيب للفترة المحددة؛ إدارة المواعيد والدوام والإجازات تبقى عبر مساراتها الحالية.',
    };
  }


  async facility(ownerId: string, facilityId: string, actorRole: UserRole, from?: string, to?: string) {
    const facility = await this.facilities.findOne({ where: { id: facilityId } });
    if (!facility || (actorRole !== UserRole.OWNER && facility.ownerUserId !== ownerId)) throw new NotFoundException('المركز غير موجود أو لا تملك صلاحية إدارته');
    const { start, end } = this.range(from, to);
    const base = () => this.facilityBookings.createQueryBuilder('b').where('b."facilityId"=:facilityId', { facilityId }).andWhere('b."startsAt">=:start AND b."startsAt"<:end', { start, end });
    const [requested, confirmed, cancelled, completed, rejected, upcoming, availableSlots, closedSlots, activeExceptions, services] = await Promise.all([
      base().andWhere('b.status=:s', { s: FacilityBookingStatus.REQUESTED }).getCount(),
      base().andWhere('b.status=:s', { s: FacilityBookingStatus.CONFIRMED }).getCount(),
      base().andWhere('b.status=:s', { s: FacilityBookingStatus.CANCELLED }).getCount(),
      base().andWhere('b.status=:s', { s: FacilityBookingStatus.COMPLETED }).getCount(),
      base().andWhere('b.status=:s', { s: FacilityBookingStatus.REJECTED }).getCount(),
      base().andWhere('b.status IN (:...statuses)', { statuses: [FacilityBookingStatus.REQUESTED, FacilityBookingStatus.CONFIRMED] }).andWhere('b."startsAt">=:now', { now: new Date() }).orderBy('b."startsAt"', 'ASC').take(15).getMany(),
      this.facilitySlots.createQueryBuilder('s').where('s."facilityId"=:facilityId', { facilityId }).andWhere('s.status=:status', { status: FacilitySlotStatus.AVAILABLE }).andWhere('s."startsAt">=:start AND s."startsAt"<:end', { start, end }).getCount(),
      this.facilitySlots.createQueryBuilder('s').where('s."facilityId"=:facilityId', { facilityId }).andWhere('s.status=:status', { status: FacilitySlotStatus.CLOSED }).andWhere('s."startsAt">=:start AND s."startsAt"<:end', { start, end }).getCount(),
      this.exceptions.createQueryBuilder('e').where('e."ownerType"=:type AND e."ownerId"=:facilityId AND e."isActive"=true', { type: WeeklyScheduleOwnerType.FACILITY, facilityId }).getCount(),
      this.services.find({ where: { facilityId, isActive: true }, order: { name: 'ASC' } }),
    ]);
    const serviceById = new Map(services.map(s => [s.id, s.name]));
    return {
      range: { from: start.toISOString(), to: end.toISOString(), timezone: 'Asia/Baghdad' },
      facility: { id: facility.id, name: facility.name, facilityType: facility.facilityType, city: facility.city, status: facility.status },
      summary: { requestedBookings: requested, confirmedBookings: confirmed, cancelledBookings: cancelled, completedBookings: completed, rejectedBookings: rejected, availableSlots, closedSlots, activeScheduleExceptions: activeExceptions },
      services: services.map(s => ({ id: s.id, name: s.name, expectedDurationMinutes: s.expectedDurationMinutes })),
      upcomingBookings: upcoming.map(b => ({ id: b.id, serviceId: b.serviceId, serviceName: serviceById.get(b.serviceId) ?? 'خدمة', patientName: b.patientName, patientPhone: b.patientPhone, startsAt: b.startsAt, status: b.status })),
      note: 'كل خدمة تحتفظ بجدولها ومدتها المستقلة. لم يتم تغيير حالة أي حجز بواسطة هذا الملخص.',
    };
  }
}
