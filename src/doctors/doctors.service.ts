import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DoctorProfile, DoctorProfileStatus } from './doctor-profile.entity';
import { UpsertDoctorProfileDto } from './dto/upsert-doctor-profile.dto';
import { ReviewDoctorProfileDto } from './dto/review-doctor-profile.dto';
import { DoctorDirectoryQueryDto } from './dto/doctor-directory-query.dto';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { DoctorRating, RatingStatus } from '../ratings/rating.entity';
import { OwnerAuditLog } from '../subscriptions/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { UploadAsset, UploadCategory } from '../uploads/upload-asset.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
    @InjectRepository(UploadAsset) private readonly uploadAssets: Repository<UploadAsset>,
    @InjectRepository(DoctorRating) private readonly ratings: Repository<DoctorRating>,
    @InjectRepository(OwnerAuditLog) private readonly auditLogs: Repository<OwnerAuditLog>,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  async saveMyProfile(userId: string, dto: UpsertDoctorProfileDto) {
    const user = await this.users.findById(userId);
    if (!user || user.role !== UserRole.DOCTOR) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    if (dto.photoUrl !== undefined) {
      const match = dto.photoUrl.match(/^\/api\/v1\/uploads\/public\/([0-9a-f-]{36})$/i);
      if (!match) throw new BadRequestException('يجب اختيار صورة الطبيب من الملفات المرفوعة داخل التطبيق');
      const image = await this.uploadAssets.findOne({ where: {
        id: match[1], ownerUserId: userId, category: UploadCategory.DOCTOR_PHOTO, isPublic: true,
      } });
      if (!image) throw new ForbiddenException('الصورة غير موجودة ضمن صور حساب الطبيب');
    }
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) profile = this.profiles.create({ ...dto, userId, status: DoctorProfileStatus.DRAFT });
    else {
      if (dto.photoUrl === undefined && profile.photoUrl) {
        const currentMatch = profile.photoUrl.match(/^\/api\/v1\/uploads\/public\/([0-9a-f-]{36})$/i);
        const currentAsset = currentMatch ? await this.uploadAssets.findOne({ where: {
          id: currentMatch[1], ownerUserId: userId, category: UploadCategory.DOCTOR_PHOTO, isPublic: true,
        } }) : null;
        if (!currentAsset) profile.photoUrl = null;
      }
      Object.assign(profile, dto);
      profile.status = DoctorProfileStatus.PENDING;
      profile.reviewNote = null;
      profile.reviewedBy = null;
      profile.reviewedAt = null;
    }
    return this.profiles.save(profile);
  }

  async submitMyProfile(userId: string) {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('أكمل بيانات ملفك الطبي أولاً');
    if (!profile.fullName || !profile.specialty || !profile.clinicName || !profile.address || !profile.city) {
      throw new ConflictException('هناك بيانات أساسية ناقصة في الملف');
    }
    const wasPending = profile.status === DoctorProfileStatus.PENDING;
    profile.status = DoctorProfileStatus.PENDING;
    profile.reviewNote = null;
    profile.reviewedBy = null;
    profile.reviewedAt = null;
    const saved = await this.profiles.save(profile);
    if (!wasPending) await this.notifications.notifyOwners({ type: NotificationType.OWNER_DOCTOR_PROFILE_PENDING, title: 'ملف طبيب بانتظار المراجعة', body: `أرسل الطبيب ${saved.fullName} ملفه للمراجعة والاعتماد.`, data: { event: 'owner_doctor_profile_pending', doctorId: saved.userId, profileId: saved.id, screen: 'OwnerReview' } });
    return saved;
  }

  async myProfile(userId: string) {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('لم يتم إنشاء الملف الطبي بعد');
    return profile;
  }

  async review(profileId: string, ownerId: string, dto: ReviewDoctorProfileDto) {
    const profile = await this.profiles.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('ملف الطبيب غير موجود');
    if (profile.status !== DoctorProfileStatus.PENDING) throw new ConflictException('هذا الملف ليس بانتظار المراجعة');
    profile.status = dto.decision === 'approved' ? DoctorProfileStatus.APPROVED : DoctorProfileStatus.REJECTED;
    profile.reviewNote = dto.reviewNote ?? null;
    profile.reviewedBy = ownerId;
    profile.reviewedAt = new Date();
    const saved = await this.profiles.save(profile);
    await this.auditLogs.save(this.auditLogs.create({ownerId,action:`doctor_profile_${dto.decision}`,targetType:'doctor_profile',targetId:profile.id,details:{doctorId:profile.userId,reviewNote:profile.reviewNote}}));
    return saved;
  }

  async pendingProfiles() {
    return this.profiles.find({ where: { status: DoctorProfileStatus.PENDING }, order: { createdAt: 'ASC' } });
  }

  /** Public search exposes approved doctors only. Area/district filtering is intentionally not supported. */
  async publicDirectory(filters: DoctorDirectoryQueryDto) {
    const page = filters.page ?? 0;
    const limit = filters.limit ?? 20;
    const direction = filters.order ?? 'ASC';
    const qb = this.profiles.createQueryBuilder('p')
      .leftJoin(subQuery => subQuery
        .select('r.doctorId', 'doctorId')
        .addSelect('AVG(r.stars)', 'average')
        .addSelect('COUNT(r.id)', 'ratingCount')
        .from(DoctorRating, 'r')
        .where('r.status = :published', { published: RatingStatus.PUBLISHED })
        .groupBy('r.doctorId'), 'stats', 'stats."doctorId" = p."userId"')
      .addSelect('COALESCE(stats.average, 0)', 'ratingAverage')
      .addSelect('COALESCE(stats."ratingCount", 0)', 'ratingCount')
      .where('p.status = :approved', { approved: DoctorProfileStatus.APPROVED });

    if (filters.name?.trim()) qb.andWhere('p.fullName ILIKE :name', { name: `%${filters.name.trim()}%` });
    if (filters.q?.trim()) {
      const searchText = filters.q.trim();
      qb.andWhere(new Brackets(search => search
        .where('p.fullName ILIKE :searchText', { searchText: `%${searchText}%` })
        .orWhere('p.specialty ILIKE :searchText')
        .orWhere('p.subSpecialty ILIKE :searchText')
        .orWhere('p.clinicName ILIKE :searchText')));
    }
    if (filters.specialty?.trim()) qb.andWhere('p.specialty ILIKE :specialty', { specialty: `%${filters.specialty.trim()}%` });
    if (filters.subSpecialty?.trim()) qb.andWhere('p.subSpecialty ILIKE :subSpecialty', { subSpecialty: `%${filters.subSpecialty.trim()}%` });
    if (filters.city?.trim()) qb.andWhere('LOWER(p.city) = LOWER(:city)', { city: filters.city.trim() });
    if (filters.minRating !== undefined && filters.minRating > 0) {
      qb.andWhere('COALESCE(stats.average, 0) >= :minRating', { minRating: filters.minRating });
    }

    const sort = filters.sort ?? 'name';
    if (sort === 'rating') qb.orderBy('COALESCE(stats.average, 0)', direction).addOrderBy('p.fullName', 'ASC');
    else if (sort === 'experience') qb.orderBy('p.experienceYears', direction).addOrderBy('p.fullName', 'ASC');
    else if (sort === 'newest') qb.orderBy('p.createdAt', direction);
    else qb.orderBy('p.fullName', direction);

    const [items, total] = await qb.skip(page * limit).take(limit).getManyAndCount();
    // Return only public doctor fields; internal review metadata and account identifiers stay private.
    const statsRows = items.length ? await this.ratings.createQueryBuilder('r')
      .select('r.doctorId', 'doctorId').addSelect('AVG(r.stars)', 'average').addSelect('COUNT(r.id)', 'count')
      .where('r.doctorId IN (:...doctorIds) AND r.status = :status', {
        doctorIds: items.map(p => p.userId), status: RatingStatus.PUBLISHED,
      }).groupBy('r.doctorId').getRawMany() : [];
    const statsByDoctor = new Map(statsRows.map(row => [row.doctorId, row]));
    const publicItems = items.map(p => {
      const stats = statsByDoctor.get(p.userId);
      return {
        id: p.id, fullName: p.fullName, specialty: p.specialty, subSpecialty: p.subSpecialty,
        qualifications: p.qualifications, experienceYears: p.experienceYears, bio: p.bio,
        clinicName: p.clinicName, address: p.address, city: p.city,
        contactPhone: p.contactPhone, photoUrl: p.photoUrl,
        ratingAverage: Number(stats?.average ?? 0), ratingCount: Number(stats?.count ?? 0),
      };
    });
    return { items: publicItems, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async approvedUserIdForProfile(profileId: string) {
    const profile = await this.profiles.findOne({ where: { id: profileId, status: DoctorProfileStatus.APPROVED }, select: { id: true, userId: true } });
    if (!profile) throw new NotFoundException('الطبيب غير موجود في الدليل');
    return profile.userId;
  }

  async publicDoctor(profileId: string) {
    const p = await this.profiles.findOne({ where: { id: profileId, status: DoctorProfileStatus.APPROVED } });
    if (!p) throw new NotFoundException('الطبيب غير موجود في الدليل');
    const stats = await this.ratings.createQueryBuilder('r')
      .select('AVG(r.stars)', 'average').addSelect('COUNT(r.id)', 'count')
      .where('r.doctorId = :doctorId AND r.status = :status', { doctorId: p.userId, status: RatingStatus.PUBLISHED })
      .getRawOne();
    const latestRatings = await this.ratings.find({
      where: { doctorId: p.userId, status: RatingStatus.PUBLISHED },
      select: { id: true, stars: true, comment: true, createdAt: true },
      order: { createdAt: 'DESC' }, take: 20,
    });
    return {
      id: p.id, fullName: p.fullName, specialty: p.specialty, subSpecialty: p.subSpecialty,
      qualifications: p.qualifications, experienceYears: p.experienceYears, bio: p.bio,
      clinicName: p.clinicName, address: p.address, city: p.city,
      contactPhone: p.contactPhone, photoUrl: p.photoUrl,
      ratingAverage: Number(stats?.average ?? 0), ratingCount: Number(stats?.count ?? 0), ratings: latestRatings,
    };
  }
}
