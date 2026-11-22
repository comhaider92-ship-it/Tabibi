import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { UserRole } from '../users/user.entity';
import { DoctorRating, RatingStatus } from './rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ModerateRatingDto } from './dto/moderate-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DoctorRating) private readonly ratings: Repository<DoctorRating>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
  ) {}

  async create(dto: CreateRatingDto, patientId: string) {
    return this.dataSource.transaction(async manager => {
      const appointment = await manager.getRepository(Appointment).createQueryBuilder('a')
        .setLock('pessimistic_write').where('a.id = :id', { id: dto.appointmentId }).getOne();
      if (!appointment) throw new NotFoundException('الحجز غير موجود');
      if (appointment.beneficiaryId !== patientId) throw new ForbiddenException('التقييم متاح للمريض المستفيد من الحجز فقط');
      if (appointment.status !== AppointmentStatus.COMPLETED) throw new BadRequestException('يمكن تقييم الطبيب بعد إكمال الموعد فقط');
      const existing = await manager.getRepository(DoctorRating).findOne({ where: { appointmentId: appointment.id } });
      if (existing) throw new ConflictException('تم تقييم هذا الحجز مسبقاً');
      const rating = manager.getRepository(DoctorRating).create({
        appointmentId: appointment.id, doctorId: appointment.doctorId, patientId,
        stars: dto.stars, comment: dto.comment?.trim() || null, status: RatingStatus.PUBLISHED,
      });
      return manager.getRepository(DoctorRating).save(rating);
    });
  }

  async listDoctor(doctorId: string, viewer: { sub: string; role: UserRole }) {
    if (viewer.role === UserRole.DOCTOR && viewer.sub !== doctorId) throw new ForbiddenException('لا يمكنك مشاهدة تقييمات طبيب آخر من هذه الصفحة');
    const rows = await this.ratings.find({ where: { doctorId, status: RatingStatus.PUBLISHED }, order: { createdAt: 'DESC' }, take: 100 });
    // Aggregate across all published rows, not only the latest 100.
    const aggregate = await this.ratings.createQueryBuilder('r').select('AVG(r.stars)', 'average').addSelect('COUNT(*)', 'count')
      .where('r.doctorId = :doctorId AND r.status = :status', { doctorId, status: RatingStatus.PUBLISHED }).getRawOne();
    return { average: Number(aggregate?.average ?? 0), count: Number(aggregate?.count ?? 0), items: rows };
  }

  async report(id: string, patientId: string) {
    const rating = await this.ratings.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('التقييم غير موجود');
    if (rating.patientId !== patientId) throw new ForbiddenException('يمكن لصاحب التقييم فقط الإبلاغ عنه');
    if (rating.isReported) return rating;
    rating.isReported = true;
    rating.status = RatingStatus.UNDER_REVIEW;
    return this.ratings.save(rating);
  }

  async listForOwner() {
    return this.ratings.find({ where: [{ status: RatingStatus.UNDER_REVIEW }, { isReported: true }], order: { updatedAt: 'DESC' }, take: 200 });
  }

  async moderate(id: string, dto: ModerateRatingDto, ownerId: string) {
    const rating = await this.ratings.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('التقييم غير موجود');
    rating.status = dto.status as RatingStatus;
    rating.moderationNote = dto.note?.trim() || null;
    rating.moderatedBy = ownerId;
    rating.moderatedAt = new Date();
    return this.ratings.save(rating);
  }
}
