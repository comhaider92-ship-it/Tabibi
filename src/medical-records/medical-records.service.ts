import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { UserRole } from '../users/user.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecord, MedicalRecordAuthorRole, MedicalRecordType } from './medical-record.entity';
import { MedicalRecordAccessLog } from './medical-record-access-log.entity';
import { MedicalRecordAttachment } from './medical-record-attachment.entity';
import { MedicalRecordShareConsent } from './medical-record-share-consent.entity';
import { UploadAsset, UploadCategory } from '../uploads/upload-asset.entity';
import { DoctorProfile, DoctorProfileStatus } from '../doctors/doctor-profile.entity';
import { CreateMedicalShareConsentDto } from './dto/create-medical-share-consent.dto';
import { CreateMedicalPrescriptionDto } from './dto/create-medical-prescription.dto';
import { CreateMedicalLabResultDto } from './dto/create-medical-lab-result.dto';
import { MedicalPrescription } from './medical-prescription.entity';
import { MedicalLabResult } from './medical-lab-result.entity';
import { MedicalClinicalReport } from './medical-clinical-report.entity';
import { CreateMedicalClinicalReportDto } from './dto/create-medical-clinical-report.dto';
import { HealthFileQueryDto } from './dto/health-file-query.dto';
import { User } from '../users/user.entity';

type Actor = { sub: string; role: UserRole };
@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord) private readonly records: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordAccessLog) private readonly logs: Repository<MedicalRecordAccessLog>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(MedicalRecordAttachment) private readonly attachments: Repository<MedicalRecordAttachment>,
    @InjectRepository(MedicalRecordShareConsent) private readonly consents: Repository<MedicalRecordShareConsent>,
    @InjectRepository(UploadAsset) private readonly uploads: Repository<UploadAsset>,
    @InjectRepository(DoctorProfile) private readonly doctors: Repository<DoctorProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private async log(patientUserId: string, actor: Actor, action: string, recordId: string | null, appointmentId: string | null) {
    await this.logs.save(this.logs.create({ patientUserId, actorUserId: actor.sub, actorRole: actor.role, action, recordId, appointmentId }));
  }

  /** Build public verification links only from an explicitly configured API URL. */
  private getPublicApiBaseUrl(): string {
    const configured = (process.env.PUBLIC_API_BASE_URL || '').trim();
    if (!configured) {
      throw new Error('PUBLIC_API_BASE_URL must be configured before generating medical verification links');
    }

    let parsed: URL;
    try {
      parsed = new URL(configured);
    } catch {
      throw new Error('PUBLIC_API_BASE_URL must be a valid absolute URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('PUBLIC_API_BASE_URL must use HTTP or HTTPS');
    }
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw new Error('PUBLIC_API_BASE_URL must use HTTPS in production');
    }
    if (['localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2'].includes(parsed.hostname) || parsed.hostname.endsWith('.local')) {
      throw new Error('PUBLIC_API_BASE_URL must use a host reachable by patients');
    }
    if (!parsed.pathname.replace(/\/+$/, '').endsWith('/api/v1') || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error('PUBLIC_API_BASE_URL must end in /api/v1 and must not contain credentials, query, or fragment');
    }

    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  }

  async list(actor: Actor, appointmentId?: string) {
    if (actor.role === UserRole.OWNER) throw new ForbiddenException('السجل الطبي غير متاح لحساب المالك');
    if (actor.role === UserRole.PATIENT) {
      if (appointmentId) throw new BadRequestException('لا يمكن تقييد سجل المريض بموعد من هذا المسار');
      const rows = await this.records.find({ where: { patientUserId: actor.sub, deletedAt: IsNull() }, order: { createdAt: 'DESC' }, take: 200 });
      if (rows.length) await Promise.all(rows.map(r => this.log(actor.sub, actor, 'read', r.id, r.appointmentId)));
      else await this.log(actor.sub, actor, 'list', null, null);
      return rows;
    }
    if (!appointmentId) throw new BadRequestException('الطبيب يحتاج إلى تحديد موعد مرتبط للوصول إلى السجل');
    const appointment = await this.appointments.findOne({ where: { id: appointmentId, doctorId: actor.sub } });
    if (!appointment) throw new ForbiddenException('لا تملك علاقة علاجية بهذا الموعد');
    const patientId = appointment.beneficiaryId || (!appointment.beneficiaryName ? appointment.bookedByUserId : null);
    if (!patientId) throw new ForbiddenException('لا يمكن عرض سجل مستفيد غير مسجل بحساب');
    const rows = await this.records.find({ where: { patientUserId: patientId, appointmentId, deletedAt: IsNull() }, order: { createdAt: 'DESC' }, take: 100 });
    await this.log(patientId, actor, 'read', null, appointmentId);
    return rows;
  }

  async healthFile(actor: Actor, query: HealthFileQueryDto) {
    if (actor.role !== UserRole.PATIENT) {
      throw new ForbiddenException('الملف الصحي الشامل متاح لصاحب الحساب فقط؛ يمكن للطبيب الوصول إلى السجلات المرتبطة بموعد أو بموافقة مشاركة');
    }
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException('تاريخ البداية يجب ألا يتجاوز تاريخ النهاية');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.records.createQueryBuilder('record')
      .where('record.patientUserId = :patientId', { patientId: actor.sub })
      .andWhere('record.deletedAt IS NULL');
    if (query.recordType) qb.andWhere('record.recordType = :recordType', { recordType: query.recordType });
    if (query.from) qb.andWhere('record.createdAt >= :fromDate', { fromDate: new Date(query.from) });
    if (query.to) qb.andWhere('record.createdAt <= :toDate', { toDate: new Date(query.to) });

    const [records, total] = await qb.orderBy('record.createdAt', 'DESC')
      .addOrderBy('record.id', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    if (!records.length) {
      await this.log(actor.sub, actor, 'health_file_read', null, null);
      return { patientUserId: actor.sub, items: [], pagination: { page, limit, total, pages: 0 } };
    }

    const ids = records.map(record => record.id);
    const [prescriptions, labResults, clinicalReports, attachments] = await Promise.all([
      this.dataSource.getRepository(MedicalPrescription).find({ where: { recordId: In(ids) } }),
      this.dataSource.getRepository(MedicalLabResult).find({ where: { recordId: In(ids) } }),
      this.dataSource.getRepository(MedicalClinicalReport).find({ where: { recordId: In(ids) } }),
      this.attachments.find({ where: { recordId: In(ids) }, select: { id: true, recordId: true, createdAt: true } }),
    ]);
    const prescriptionByRecord = new Map(prescriptions.map(item => [item.recordId, item]));
    const labByRecord = new Map(labResults.map(item => [item.recordId, item]));
    const reportByRecord = new Map(clinicalReports.map(item => [item.recordId, item]));
    const attachmentCount = new Map<string, number>();
    for (const attachment of attachments) attachmentCount.set(attachment.recordId, (attachmentCount.get(attachment.recordId) || 0) + 1);

    await Promise.all(records.map(record => this.log(actor.sub, actor, 'health_file_read', record.id, record.appointmentId)));
    const items = records.map(record => ({
      ...record,
      prescription: prescriptionByRecord.get(record.id) || null,
      labResult: labByRecord.get(record.id) || null,
      clinicalReport: reportByRecord.get(record.id) || null,
      attachmentCount: attachmentCount.get(record.id) || 0,
    }));
    return { patientUserId: actor.sub, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async create(actor: Actor, dto: CreateMedicalRecordDto) {
    if ([MedicalRecordType.PRESCRIPTION, MedicalRecordType.TEST_RESULT].includes(dto.recordType as MedicalRecordType)) {
      throw new BadRequestException('أنشئ الوصفات ونتائج التحاليل من المسارات الطبية المنظمة');
    }
    if (actor.role === UserRole.OWNER) throw new ForbiddenException('لا يمكن للمالك إنشاء سجلات طبية');
    let patientUserId = actor.sub;
    let appointmentId: string | null = null;
    if (actor.role === UserRole.DOCTOR) {
      if (!dto.appointmentId) throw new BadRequestException('إنشاء سجل الطبيب يتطلب ربطه بموعد');
      const appointment = await this.appointments.findOne({ where: { id: dto.appointmentId, doctorId: actor.sub } });
      if (!appointment) throw new ForbiddenException('لا تملك صلاحية إنشاء سجل لهذا الموعد');
      if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.NO_SHOW) throw new ForbiddenException('لا يمكن إنشاء سجل طبي لموعد ملغى أو لم يحضر فيه المريض');
      patientUserId = appointment.beneficiaryId || (!appointment.beneficiaryName ? appointment.bookedByUserId : '');
      if (!patientUserId) throw new ForbiddenException('المستفيد غير مسجل، لا يمكن إنشاء سجل طبي مرتبط بحسابه');
      appointmentId = appointment.id;
    } else if (dto.appointmentId) {
      const appointment = await this.appointments.findOne({ where: { id: dto.appointmentId } });
      if (!appointment || (appointment.bookedByUserId !== actor.sub && appointment.beneficiaryId !== actor.sub)) throw new ForbiddenException('لا تملك صلاحية ربط السجل بهذا الموعد');
      appointmentId = appointment.id;
    }
    const row = await this.records.save(this.records.create({ patientUserId, appointmentId, authorUserId: actor.sub,
      authorRole: actor.role === UserRole.DOCTOR ? MedicalRecordAuthorRole.DOCTOR : MedicalRecordAuthorRole.PATIENT,
      recordType: dto.recordType as MedicalRecordType, title: dto.title.trim(), content: dto.content.trim(), deletedAt: null }));
    await this.log(patientUserId, actor, 'create', row.id, appointmentId);
    return row;
  }

  async update(id: string, actor: Actor, dto: UpdateMedicalRecordDto) {
    const row = await this.records.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) throw new NotFoundException('السجل غير موجود');
    if ([MedicalRecordType.PRESCRIPTION, MedicalRecordType.TEST_RESULT].includes(row.recordType)) {
      throw new ForbiddenException('لا يمكن تعديل نوع المستند الطبي المنظم من مسار السجل العام');
    }
    if (dto.recordType && [MedicalRecordType.PRESCRIPTION, MedicalRecordType.TEST_RESULT].includes(dto.recordType as MedicalRecordType)) {
      throw new BadRequestException('الوصفات ونتائج التحاليل تُنشأ من المسارات الطبية المنظمة');
    }
    if (actor.role === UserRole.OWNER || row.authorUserId !== actor.sub || (actor.role === UserRole.DOCTOR && row.appointmentId === null)) throw new ForbiddenException('التعديل متاح لمنشئ السجل فقط');
    if (dto.title !== undefined) row.title = dto.title.trim();
    if (dto.content !== undefined) row.content = dto.content.trim();
    if (dto.recordType !== undefined) row.recordType = dto.recordType as MedicalRecordType;
    const saved = await this.records.save(row);
    await this.log(row.patientUserId, actor, 'update', row.id, row.appointmentId);
    return saved;
  }

  async remove(id: string, actor: Actor) {
    const row = await this.records.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) throw new NotFoundException('السجل غير موجود');
    if (actor.role !== UserRole.PATIENT || row.patientUserId !== actor.sub || row.authorRole !== MedicalRecordAuthorRole.PATIENT) throw new ForbiddenException('حذف السجل متاح للمريض لسجلاته الشخصية فقط');
    row.deletedAt = new Date();
    await this.records.save(row);
    await this.log(row.patientUserId, actor, 'delete', row.id, row.appointmentId);
    return { deleted: true };
  }

  async accessHistory(actor: Actor) {
    if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('سجل الاطلاع متاح لصاحب الملف الطبي فقط');
    const events = await this.logs.find({ where: { patientUserId: actor.sub }, order: { createdAt: 'DESC' }, take: 200,
      select: { id: true, actorUserId: true, actorRole: true, action: true, recordId: true, appointmentId: true, createdAt: true } });
    const actorIds = [...new Set(events.map(event => event.actorUserId))];
    const recordIds = [...new Set(events.map(event => event.recordId).filter((id): id is string => !!id))];
    const [users, records] = await Promise.all([
      actorIds.length ? this.users.find({ where: { id: In(actorIds) }, select: { id: true, displayName: true, role: true } }) : [],
      recordIds.length ? this.records.find({ where: { id: In(recordIds) }, select: { id: true, title: true, recordType: true, deletedAt: true } }) : [],
    ]);
    const userById = new Map(users.map(user => [user.id, user]));
    const recordById = new Map(records.map(record => [record.id, record]));
    const actionLabels: Record<string, string> = {
      read: 'اطّلع على السجل الطبي', list: 'عرض قائمة السجلات', health_file_read: 'عرض الملف الصحي',
      create: 'إنشاء سجل طبي', update: 'تعديل سجل طبي', delete: 'حذف سجل طبي',
      share_grant: 'منح موافقة مشاركة', share_revoke: 'إلغاء مشاركة سجل', share_read: 'فتح سجل عبر المشاركة',
      attachment_link: 'إضافة مرفق طبي', attachment_read: 'عرض المرفقات الطبية', attachment_download: 'تنزيل مرفق طبي',
      prescription_create: 'إنشاء وصفة طبية', prescription_read: 'عرض وصفة طبية',
      lab_result_create: 'إضافة نتيجة تحليل', lab_result_read: 'عرض نتيجة تحليل',
      clinical_report_create: 'إنشاء تقرير سريري', clinical_report_read: 'عرض تقرير سريري',
    };
    return events.map(event => {
      const user = userById.get(event.actorUserId);
      const record = event.recordId ? recordById.get(event.recordId) : undefined;
      return {
        id: event.id, action: event.action, actionLabel: actionLabels[event.action] || 'نشاط على الملف الطبي',
        actorRole: event.actorRole, actorName: user?.displayName || (event.actorRole === UserRole.PATIENT ? 'أنت' : 'مستخدم غير متاح'),
        actorIsPatient: event.actorUserId === actor.sub, recordId: event.recordId,
        recordTitle: record?.title || (event.recordId ? 'سجل طبي غير متاح' : null),
        recordType: record?.recordType || null, recordDeleted: !!record?.deletedAt,
        appointmentId: event.appointmentId, createdAt: event.createdAt,
      };
    });
  }

  async grantShare(actor: Actor, dto: CreateMedicalShareConsentDto) {
    if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('المريض وحده يمنح موافقة مشاركة سجلاته');
    const expiry = new Date(dto.expiresAt);
    const now = new Date();
    if (!Number.isFinite(expiry.getTime()) || expiry <= now || expiry.getTime() > now.getTime() + 30 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('مدة الموافقة يجب أن تكون مستقبلاً وبحد أقصى 30 يوماً');
    }
    const doctor = await this.doctors.findOne({ where: { userId: dto.doctorUserId } });
    if (!doctor || doctor.status !== DoctorProfileStatus.APPROVED) throw new NotFoundException('الطبيب غير موجود أو غير معتمد حالياً');
    const recordIds = [...new Set(dto.recordIds)];
    if (recordIds.length !== dto.recordIds.length) throw new BadRequestException('توجد سجلات مكررة في طلب المشاركة');
    const rows = await this.records.find({ where: { id: In(recordIds), patientUserId: actor.sub, deletedAt: IsNull() } });
    if (rows.length !== recordIds.length) throw new ForbiddenException('يجب أن تكون جميع السجلات المحددة مملوكة لك وغير محذوفة');
    const consent = await this.consents.save(this.consents.create({ patientUserId: actor.sub, doctorUserId: dto.doctorUserId,
      recordIds, expiresAt: expiry, allowDownload: dto.allowDownload === true, revokedAt: null }));
    await Promise.all(rows.map(row => this.log(actor.sub, actor, 'share_grant', row.id, row.appointmentId)));
    return { id: consent.id, doctorUserId: consent.doctorUserId, recordIds: consent.recordIds,
      expiresAt: consent.expiresAt, allowDownload: consent.allowDownload, revokedAt: consent.revokedAt, createdAt: consent.createdAt };
  }

  async listShares(actor: Actor) {
    if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('قائمة الموافقات متاحة للمريض فقط');
    const consents = await this.consents.find({ where: { patientUserId: actor.sub }, order: { createdAt: 'DESC' }, take: 100,
      select: { id: true, doctorUserId: true, recordIds: true, expiresAt: true, allowDownload: true, revokedAt: true, createdAt: true } });
    if (!consents.length) return [];

    const doctorIds = [...new Set(consents.map(item => item.doctorUserId))];
    const recordIds = [...new Set(consents.flatMap(item => item.recordIds))];
    const [doctorProfiles, records, attachmentLinks] = await Promise.all([
      this.doctors.find({ where: { userId: In(doctorIds) }, select: { userId: true, fullName: true, specialty: true, clinicName: true, city: true, status: true } }),
      this.records.find({ where: { id: In(recordIds), patientUserId: actor.sub, deletedAt: IsNull() }, select: { id: true, title: true, recordType: true, createdAt: true } }),
      this.attachments.find({ where: { recordId: In(recordIds) }, select: { id: true, recordId: true } }),
    ]);
    const doctorById = new Map(doctorProfiles.map(item => [item.userId, item]));
    const recordById = new Map(records.map(item => [item.id, item]));
    const attachmentCount = new Map<string, number>();
    for (const link of attachmentLinks) attachmentCount.set(link.recordId, (attachmentCount.get(link.recordId) || 0) + 1);

    return consents.map(consent => {
      const doctor = doctorById.get(consent.doctorUserId);
      const sharedRecords = consent.recordIds.map(id => recordById.get(id)).filter((record): record is MedicalRecord => !!record).map(record => ({
        id: record.id, title: record.title, recordType: record.recordType, createdAt: record.createdAt,
        attachmentCount: attachmentCount.get(record.id) || 0,
      }));
      return {
        ...consent,
        doctor: doctor ? { fullName: doctor.fullName, specialty: doctor.specialty, clinicName: doctor.clinicName, city: doctor.city,
          currentlyApproved: doctor.status === DoctorProfileStatus.APPROVED } : null,
        records: sharedRecords,
      };
    });
  }

  async revokeShare(id: string, actor: Actor) {
    if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('سحب الموافقة متاح للمريض فقط');
    const consent = await this.consents.findOne({ where: { id, patientUserId: actor.sub } });
    if (!consent) throw new NotFoundException('الموافقة غير موجودة');
    if (!consent.revokedAt) {
      consent.revokedAt = new Date();
      await this.consents.save(consent);
      const rows = await this.records.find({ where: { id: In(consent.recordIds), patientUserId: actor.sub } });
      await Promise.all(rows.map(row => this.log(actor.sub, actor, 'share_revoke', row.id, row.appointmentId)));
    }
    return { id: consent.id, revoked: true, revokedAt: consent.revokedAt };
  }

  async revokeSharedRecord(consentId: string, recordId: string, actor: Actor) {
    if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('تعديل السجلات المشتركة متاح للمريض فقط');
    return this.dataSource.transaction(async manager => {
      const consentRepo = manager.getRepository(MedicalRecordShareConsent);
      const recordRepo = manager.getRepository(MedicalRecord);
      const logRepo = manager.getRepository(MedicalRecordAccessLog);
      const consent = await consentRepo.createQueryBuilder('consent')
        .setLock('pessimistic_write')
        .where('consent.id = :consentId AND consent.patientUserId = :patientId', { consentId, patientId: actor.sub })
        .getOne();
      if (!consent) throw new NotFoundException('موافقة المشاركة غير موجودة');
      if (consent.revokedAt || new Date(consent.expiresAt) <= new Date()) {
        throw new BadRequestException('المشاركة ملغاة أو منتهية مسبقاً');
      }
      if (!consent.recordIds.includes(recordId)) {
        throw new NotFoundException('هذا السجل غير مشمول بهذه الموافقة');
      }
      const record = await recordRepo.findOne({ where: { id: recordId, patientUserId: actor.sub } });
      if (!record) throw new NotFoundException('السجل الطبي غير موجود');

      consent.recordIds = consent.recordIds.filter(id => id !== recordId);
      if (consent.recordIds.length === 0) consent.revokedAt = new Date();
      await consentRepo.save(consent);
      await logRepo.save(logRepo.create({ patientUserId: actor.sub, actorUserId: actor.sub,
        actorRole: actor.role, action: 'share_revoke', recordId: record.id, appointmentId: record.appointmentId }));
      return {
        id: consent.id,
        removedRecordId: recordId,
        remainingRecordIds: consent.recordIds,
        revoked: !!consent.revokedAt,
        revokedAt: consent.revokedAt,
      };
    });
  }

  async sharedWithMe(actor: Actor) {
    if (actor.role !== UserRole.DOCTOR) throw new ForbiddenException('هذه القائمة مخصصة للطبيب');
    const doctor = await this.doctors.findOne({ where: { userId: actor.sub, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new ForbiddenException('حساب الطبيب غير معتمد حالياً');
    const grants = await this.consents.createQueryBuilder('c').where('c.doctorUserId = :doctorId', { doctorId: actor.sub })
      .andWhere('c.revokedAt IS NULL AND c.expiresAt > NOW()').getMany();
    const ids = [...new Set(grants.flatMap(grant => grant.recordIds))];
    if (!ids.length) return [];
    const rows = await this.records.find({ where: { id: In(ids), deletedAt: IsNull() }, order: { createdAt: 'DESC' }, take: 200 });
    const visible = rows.filter(row => grants.some(grant => grant.patientUserId === row.patientUserId && grant.recordIds.includes(row.id)));
    await Promise.all(visible.map(row => this.log(row.patientUserId, actor, 'share_read', row.id, row.appointmentId)));
    return visible;
  }

  async linkAttachment(recordId: string, uploadAssetId: string, actor: Actor) {
    if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('ربط المرفقات الطبية متاح للمريض فقط');
    return this.dataSource.transaction(async manager => {
      const recordRepo = manager.getRepository(MedicalRecord);
      const uploadRepo = manager.getRepository(UploadAsset);
      const attachmentRepo = manager.getRepository(MedicalRecordAttachment);
      const logRepo = manager.getRepository(MedicalRecordAccessLog);
      const record = await recordRepo.createQueryBuilder('record')
        .setLock('pessimistic_write')
        .where('record.id = :recordId AND record.patientUserId = :patientId AND record.deletedAt IS NULL',
          { recordId, patientId: actor.sub })
        .getOne();
      if (!record) throw new NotFoundException('السجل الطبي غير موجود');
      const asset = await uploadRepo.createQueryBuilder('asset')
        .setLock('pessimistic_write')
        .where('asset.id = :uploadAssetId AND asset.ownerUserId = :patientId AND asset.category = :category AND asset.isPublic = false',
          { uploadAssetId, patientId: actor.sub, category: UploadCategory.MEDICAL_ATTACHMENT })
        .getOne();
      if (!asset) throw new NotFoundException('المرفق الطبي غير موجود ضمن ملفاتك الخاصة');
      if (await attachmentRepo.findOne({ where: { uploadAssetId } })) {
        throw new BadRequestException('هذا المرفق مرتبط بسجل طبي مسبقاً');
      }
      const link = await attachmentRepo.save(attachmentRepo.create({ recordId, uploadAssetId, attachedByUserId: actor.sub }));
      await logRepo.save(logRepo.create({ patientUserId: actor.sub, actorUserId: actor.sub,
        actorRole: actor.role, action: 'attachment_link', recordId, appointmentId: record.appointmentId }));
      return { id: link.id, recordId, uploadAssetId, fileName: asset.originalName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes };
    });
  }

  async unlinkAttachment(recordId: string, uploadAssetId: string, actor: Actor) {
    if (actor.role !== UserRole.PATIENT) {
      throw new ForbiddenException('فصل المرفقات الطبية متاح لصاحب الملف فقط');
    }

    return this.dataSource.transaction(async manager => {
      const recordRepo = manager.getRepository(MedicalRecord);
      const attachmentRepo = manager.getRepository(MedicalRecordAttachment);
      const logRepo = manager.getRepository(MedicalRecordAccessLog);
      const record = await recordRepo.createQueryBuilder('record')
        .setLock('pessimistic_write')
        .where('record.id = :recordId AND record.patientUserId = :patientId AND record.deletedAt IS NULL',
          { recordId, patientId: actor.sub })
        .getOne();
      if (!record) throw new NotFoundException('السجل الطبي غير موجود');

      const link = await attachmentRepo.findOne({ where: { recordId, uploadAssetId } });
      if (!link) throw new NotFoundException('المرفق غير مرتبط بهذا السجل');

      // Detach only: retain the private upload asset and bytes so the patient can relink it later.
      await attachmentRepo.delete({ id: link.id });
      await logRepo.save(logRepo.create({ patientUserId: actor.sub, actorUserId: actor.sub,
        actorRole: actor.role, action: 'attachment_unlink', recordId: record.id, appointmentId: record.appointmentId }));
      return { unlinked: true, recordId, uploadAssetId, fileRetained: true };
    });
  }

  async listAttachments(recordId: string, actor: Actor) {
    const record = await this.records.findOne({ where: { id: recordId, deletedAt: IsNull() } });
    if (!record) throw new NotFoundException('السجل الطبي غير موجود');
    let canDownload = actor.role === UserRole.PATIENT && record.patientUserId === actor.sub;
    if (actor.role === UserRole.PATIENT) {
      if (record.patientUserId !== actor.sub) throw new ForbiddenException('لا تملك صلاحية هذا السجل');
    } else if (actor.role === UserRole.DOCTOR) {
      const doctor = await this.doctors.findOne({ where: { userId: actor.sub, status: DoctorProfileStatus.APPROVED } });
      if (!doctor) throw new ForbiddenException('حساب الطبيب غير معتمد حالياً');
      const consent = await this.consents.createQueryBuilder('c').where('c.patientUserId = :patientId', { patientId: record.patientUserId })
        .andWhere('c.doctorUserId = :doctorId', { doctorId: actor.sub }).andWhere('c.revokedAt IS NULL AND c.expiresAt > NOW()')
        .andWhere(':recordId = ANY(c.recordIds)', { recordId }).getOne();
      if (!consent) throw new ForbiddenException('لا توجد موافقة سارية لمشاهدة مرفقات هذا السجل');
      canDownload = consent.allowDownload;
    } else throw new ForbiddenException('المالك لا يملك صلاحية السجلات الطبية');
    const links = await this.attachments.find({ where: { recordId }, order: { createdAt: 'ASC' } });
    const assets = await this.uploads.find({ where: { id: In(links.map(link => link.uploadAssetId)) } });
    await this.log(record.patientUserId, actor, 'attachment_read', recordId, record.appointmentId);
    return links.map(link => {
      const asset = assets.find(item => item.id === link.uploadAssetId);
      return asset ? { id: asset.id, fileName: asset.originalName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes,
        createdAt: asset.createdAt, canDownload, downloadUrl: canDownload ? `/api/v1/uploads/${asset.id}/download` : null } : null;
    }).filter(Boolean);
  }


  private async doctorAppointmentPatient(actor: Actor, appointmentId: string) {
    if (actor.role !== UserRole.DOCTOR) throw new ForbiddenException('هذه العملية مخصصة للطبيب');
    const doctor = await this.doctors.findOne({ where: { userId: actor.sub, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new ForbiddenException('حساب الطبيب غير معتمد حالياً');
    const appointment = await this.appointments.findOne({ where: { id: appointmentId, doctorId: actor.sub } });
    if (!appointment) throw new ForbiddenException('لا تملك صلاحية هذا الموعد');
    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.NO_SHOW) {
      throw new ForbiddenException('لا يمكن إنشاء مستند طبي لموعد ملغى أو لم يحضر فيه المريض');
    }
    const patientUserId = appointment.beneficiaryId || (!appointment.beneficiaryName ? appointment.bookedByUserId : null);
    if (!patientUserId) throw new ForbiddenException('المستفيد غير مرتبط بحساب مريض');
    return { appointment, patientUserId };
  }

  async createPrescription(actor: Actor, dto: CreateMedicalPrescriptionDto) {
    const { appointment, patientUserId } = await this.doctorAppointmentPatient(actor, dto.appointmentId);
    const result = await this.dataSource.transaction(async manager => {
      const recordRepo = manager.getRepository(MedicalRecord);
      const prescriptionRepo = manager.getRepository(MedicalPrescription);
      const record = await recordRepo.save(recordRepo.create({ patientUserId, appointmentId: appointment.id,
        authorUserId: actor.sub, authorRole: MedicalRecordAuthorRole.DOCTOR, recordType: MedicalRecordType.PRESCRIPTION,
        title: dto.title.trim(), content: `وصفة طبية منظمة تحتوي على ${dto.medications.length} دواء/أدوية.`, deletedAt: null }));
      const prescription = await prescriptionRepo.save(prescriptionRepo.create({ recordId: record.id, patientUserId,
        doctorUserId: actor.sub, appointmentId: appointment.id,
        medications: dto.medications.map(item => ({ medicationName: item.medicationName.trim(), strength: item.strength?.trim(),
          dosage: item.dosage.trim(), frequency: item.frequency.trim(), duration: item.duration.trim(), instructions: item.instructions?.trim() })),
        generalInstructions: dto.generalInstructions?.trim() || null, validUntil: dto.validUntil ? new Date(dto.validUntil) : null }));
      return { record, prescription };
    });
    await this.log(patientUserId, actor, 'prescription_create', result.record.id, appointment.id);
    return { ...result.record, prescription: result.prescription };
  }

  async createClinicalReport(actor: Actor, dto: CreateMedicalClinicalReportDto) {
    const { appointment, patientUserId } = await this.doctorAppointmentPatient(actor, dto.appointmentId);
    const result = await this.dataSource.transaction(async manager => {
      const recordRepo = manager.getRepository(MedicalRecord);
      const reportRepo = manager.getRepository(MedicalClinicalReport);
      const record = await recordRepo.save(recordRepo.create({ patientUserId, appointmentId: appointment.id,
        authorUserId: actor.sub, authorRole: MedicalRecordAuthorRole.DOCTOR, recordType: MedicalRecordType.VISIT_SUMMARY,
        title: dto.title.trim(), content: dto.summary.trim(), deletedAt: null }));
      const report = await reportRepo.save(reportRepo.create({ recordId: record.id, patientUserId,
        doctorUserId: actor.sub, appointmentId: appointment.id, reportKind: dto.reportKind,
        title: dto.title.trim(), summary: dto.summary.trim(),
        sections: dto.sections.map(section => ({ heading: section.heading.trim(), body: section.body.trim() })),
        recommendations: dto.recommendations?.trim() || null, followUpPlan: dto.followUpPlan?.trim() || null,
        nextReviewDate: dto.nextReviewDate || null, verificationToken: null }));
      return { record, report };
    });
    await this.log(patientUserId, actor, 'clinical_report_create', result.record.id, appointment.id);
    return { ...result.record, report: result.report };
  }

  async getClinicalReport(recordId: string, actor: Actor) {
    const record = await this.assertStructuredRecordAccess(recordId, actor);
    const report = await this.dataSource.getRepository(MedicalClinicalReport).findOne({ where: { recordId } });
    if (!report) throw new NotFoundException('التقرير الطبي غير موجود');
    await this.log(record.patientUserId, actor, 'clinical_report_read', record.id, record.appointmentId);
    return { record, report };
  }

  async printClinicalReport(recordId: string, actor: Actor): Promise<string> {
    const { record, report } = await this.getClinicalReport(recordId, actor);
    const doctor = await this.doctors.findOne({ where: { userId: report.doctorUserId, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new NotFoundException('بيانات الطبيب غير متاحة');
    const token = await this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(MedicalClinicalReport);
      const current = await repo.findOne({ where: { recordId }, select: { id: true, recordId: true, verificationToken: true }, lock: { mode: 'pessimistic_write' } });
      if (!current) throw new NotFoundException('التقرير غير موجود');
      if (current.verificationToken) return current.verificationToken;
      current.verificationToken = randomBytes(32).toString('hex');
      await repo.save(current);
      return current.verificationToken;
    });
    const baseUrl = this.getPublicApiBaseUrl();
    const verifyUrl = `${baseUrl}/medical-records/verify/report/${token}`;
    const qr = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 170 });
    const sections = report.sections.map((section, index) => `<section class="section"><h2>${index + 1}. ${this.escapeHtml(section.heading)}</h2><p>${this.escapeHtml(section.body)}</p></section>`).join('');
    const kindLabels: Record<string, string> = { visit: 'تقرير مراجعة', diagnosis: 'تقرير تشخيص', follow_up: 'تقرير متابعة', imaging: 'تقرير أشعة', medical_summary: 'ملخص طبي' };
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${this.escapeHtml(report.title)} - طبيبي</title><style>
      *{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#182b35;background:#eef2f4;margin:0}.sheet{max-width:900px;margin:24px auto;background:#fff;padding:38px;border:1px solid #dce5e8}.head{border-bottom:3px solid #277b78;padding-bottom:18px;display:flex;justify-content:space-between;gap:20px}.brand{font-size:27px;color:#176c69;font-weight:800}.muted{font-size:13px;color:#657781;line-height:1.8}.title{font-size:23px;margin:24px 0 12px}.meta{background:#f2f7f7;padding:13px;border-radius:9px;line-height:2}.summary,.section,.follow{margin-top:18px;padding:14px;border:1px solid #dce5e8;border-radius:9px;line-height:1.9}.section h2{font-size:17px;margin:0 0 8px;color:#176c69}.section p,.summary p,.follow p{white-space:pre-wrap;margin:0}.verify{display:flex;gap:16px;align-items:center;border-top:1px solid #dce5e8;margin-top:24px;padding-top:18px}.verify img{width:105px;height:105px}.footer{font-size:12px;color:#657781;margin-top:22px}@media print{body{background:#fff}.sheet{margin:0;max-width:none;border:0;padding:12mm}.no-print{display:none}.section{break-inside:avoid}}
      </style></head><body><main class="sheet"><header class="head"><div><div class="brand">طبيبي</div><b>${this.escapeHtml(doctor.clinicName)}</b><div class="muted">${this.escapeHtml(doctor.fullName)} — ${this.escapeHtml(doctor.specialty)}</div><div class="muted">${this.escapeHtml(doctor.address)}، ${this.escapeHtml(doctor.city)}</div><div class="muted">${this.escapeHtml(doctor.contactPhone || '')}</div></div><div class="muted">مستند طبي خاص<br>رقم التقرير: ${this.escapeHtml(record.id)}</div></header><h1 class="title">${this.escapeHtml(kindLabels[report.reportKind] || 'تقرير طبي')}</h1><div class="meta"><b>${this.escapeHtml(report.title)}</b><br>تاريخ الإصدار: ${this.escapeHtml(new Date(report.createdAt).toLocaleString('ar-IQ'))}</div><section class="summary"><b>الملخص:</b><p>${this.escapeHtml(report.summary)}</p></section>${sections}${report.recommendations ? `<section class="follow"><b>التوصيات:</b><p>${this.escapeHtml(report.recommendations)}</p></section>` : ''}${report.followUpPlan ? `<section class="follow"><b>خطة المتابعة:</b><p>${this.escapeHtml(report.followUpPlan)}</p>${report.nextReviewDate ? `<p>موعد المراجعة المقترح: ${this.escapeHtml(new Date(report.nextReviewDate).toLocaleDateString('ar-IQ'))}</p>` : ''}</section>` : ''}<div class="verify"><img src="${qr}" alt="رمز التحقق"><div><b>التحقق من صحة التقرير</b><p class="muted">يعرض التحقق العام الجهة المصدرة وصلاحية المستند فقط، ولا يكشف هوية المريض أو محتوى التقرير.</p><small>${this.escapeHtml(verifyUrl)}</small></div></div><div class="footer">هذا تقرير إلكتروني خاص صادر من نظام طبيبي. يُرجى مراجعة الطبيب عند الحاجة إلى توضيح طبي.</div><button class="no-print" onclick="window.print()">طباعة / حفظ PDF</button></main></body></html>`;
  }

  async verifyClinicalReportToken(token: string) {
    if (!/^[a-f0-9]{64}$/i.test(token)) throw new NotFoundException('رمز التحقق غير صالح');
    const report = await this.dataSource.getRepository(MedicalClinicalReport).createQueryBuilder('r')
      .addSelect('r.verificationToken').where('r.verificationToken = :token', { token }).getOne();
    if (!report) throw new NotFoundException('تعذر التحقق من التقرير');
    const record = await this.records.findOne({ where: { id: report.recordId, deletedAt: IsNull() } });
    if (!record) throw new NotFoundException('التقرير غير فعال');
    const doctor = await this.doctors.findOne({ where: { userId: report.doctorUserId, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new NotFoundException('تعذر التحقق من الجهة المصدرة');
    return { valid: true, status: 'valid', documentType: 'clinical_report', reportKind: report.reportKind,
      issuer: doctor.fullName, specialty: doctor.specialty, clinicName: doctor.clinicName,
      issuedAt: report.createdAt, privacy: 'لا يتم عرض اسم المريض أو محتوى التقرير عبر خدمة التحقق العامة' };
  }

  async createLabResult(actor: Actor, dto: CreateMedicalLabResultDto) {
    const { appointment, patientUserId } = await this.doctorAppointmentPatient(actor, dto.appointmentId);
    const result = await this.dataSource.transaction(async manager => {
      const recordRepo = manager.getRepository(MedicalRecord);
      const labRepo = manager.getRepository(MedicalLabResult);
      const record = await recordRepo.save(recordRepo.create({ patientUserId, appointmentId: appointment.id,
        authorUserId: actor.sub, authorRole: MedicalRecordAuthorRole.DOCTOR, recordType: MedicalRecordType.TEST_RESULT,
        title: `نتيجة تحليل: ${dto.testName.trim()}`, content: dto.resultValue.trim(), deletedAt: null }));
      const labResult = await labRepo.save(labRepo.create({ recordId: record.id, patientUserId, doctorUserId: actor.sub,
        appointmentId: appointment.id, testName: dto.testName.trim(), resultValue: dto.resultValue.trim(),
        unit: dto.unit?.trim() || null, referenceRange: dto.referenceRange?.trim() || null,
        interpretation: dto.interpretation || 'not_interpreted', laboratoryName: dto.laboratoryName?.trim() || null,
        performedOn: dto.performedOn || null, clinicalComment: dto.clinicalComment?.trim() || null }));
      return { record, labResult };
    });
    await this.log(patientUserId, actor, 'lab_result_create', result.record.id, appointment.id);
    return { ...result.record, labResult: result.labResult };
  }

  private async assertStructuredRecordAccess(recordId: string, actor: Actor) {
    if (actor.role === UserRole.OWNER) throw new ForbiddenException('المالك لا يملك صلاحية السجلات الطبية');
    const record = await this.records.findOne({ where: { id: recordId, deletedAt: IsNull() } });
    if (!record) throw new NotFoundException('السجل الطبي غير موجود');
    if (actor.role === UserRole.PATIENT && record.patientUserId === actor.sub) return record;
    if (actor.role !== UserRole.DOCTOR) throw new ForbiddenException('لا تملك صلاحية هذا السجل');
    const doctor = await this.doctors.findOne({ where: { userId: actor.sub, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new ForbiddenException('حساب الطبيب غير معتمد حالياً');
    const appointmentAccess = record.appointmentId ? await this.appointments.findOne({ where: { id: record.appointmentId, doctorId: actor.sub } }) : null;
    const consent = await this.consents.createQueryBuilder('c').where('c.patientUserId = :patientId', { patientId: record.patientUserId })
      .andWhere('c.doctorUserId = :doctorId', { doctorId: actor.sub })
      .andWhere('c.revokedAt IS NULL AND c.expiresAt > NOW()').andWhere(':recordId = ANY(c.recordIds)', { recordId }).getOne();
    if (!appointmentAccess && !consent) throw new ForbiddenException('لا توجد علاقة علاجية أو موافقة مشاركة سارية لهذا السجل');
    return record;
  }

  async getPrescription(recordId: string, actor: Actor) {
    const record = await this.assertStructuredRecordAccess(recordId, actor);
    if (record.recordType !== MedicalRecordType.PRESCRIPTION) throw new NotFoundException('الوصفة غير موجودة');
    const prescription = await this.dataSource.getRepository(MedicalPrescription).findOne({ where: { recordId } });
    if (!prescription) throw new NotFoundException('تفاصيل الوصفة غير موجودة');
    await this.log(record.patientUserId, actor, 'prescription_read', record.id, record.appointmentId);
    return { record, prescription };
  }

  async getLabResult(recordId: string, actor: Actor) {
    const record = await this.assertStructuredRecordAccess(recordId, actor);
    if (record.recordType !== MedicalRecordType.TEST_RESULT) throw new NotFoundException('نتيجة التحليل غير موجودة');
    const labResult = await this.dataSource.getRepository(MedicalLabResult).findOne({ where: { recordId } });
    if (!labResult) throw new NotFoundException('تفاصيل نتيجة التحليل غير موجودة');
    await this.log(record.patientUserId, actor, 'lab_result_read', record.id, record.appointmentId);
    return { record, labResult };
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char] as string));
  }

  async printPrescription(recordId: string, actor: Actor): Promise<string> {
    const { record, prescription } = await this.getPrescription(recordId, actor);
    const doctor = await this.doctors.findOne({ where: { userId: prescription.doctorUserId, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new NotFoundException('بيانات الطبيب غير متاحة');
    const verifyToken = await this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(MedicalPrescription);
      const current = await repo.findOne({ where: { recordId }, select: { id: true, recordId: true, verificationToken: true }, lock: { mode: 'pessimistic_write' } });
      if (!current) throw new NotFoundException('الوصفة غير موجودة');
      if (current.verificationToken) return current.verificationToken;
      current.verificationToken = randomBytes(32).toString('hex');
      await repo.save(current);
      return current.verificationToken;
    });
    const baseUrl = this.getPublicApiBaseUrl();
    const verifyUrl = `${baseUrl}/medical-records/verify/${verifyToken}`;
    const qr = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 180 });
    const medications = prescription.medications.map((m, i) => `<tr><td>${i+1}</td><td>${this.escapeHtml(m.medicationName)}</td><td>${this.escapeHtml(m.strength || '—')}</td><td>${this.escapeHtml(m.dosage)}</td><td>${this.escapeHtml(m.frequency)}</td><td>${this.escapeHtml(m.duration)}</td><td>${this.escapeHtml(m.instructions || '—')}</td></tr>`).join('');
    const validUntil = prescription.validUntil ? new Date(prescription.validUntil).toLocaleDateString('ar-IQ') : 'غير محدد';
    const issuedAt = new Date(prescription.createdAt).toLocaleString('ar-IQ');
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>وصفة طبية - طبيبي</title><style>
      *{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#17212b;margin:0;background:#eef1f4}.sheet{max-width:1000px;margin:24px auto;background:#fff;padding:36px;border:1px solid #d8dee5}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #277b78;padding-bottom:18px}.brand{font-size:27px;font-weight:700;color:#176c69}.muted{color:#64717d;font-size:13px}.clinic{font-size:18px;font-weight:700;margin-top:8px}.title{font-size:24px;margin:24px 0 14px}.meta{display:flex;gap:24px;flex-wrap:wrap;background:#f4f7f8;padding:14px;border-radius:8px}.meta div{min-width:180px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}th,td{border:1px solid #dce2e7;padding:10px;text-align:right;vertical-align:top}th{background:#edf4f4}.notes{margin-top:20px;padding:14px;border:1px solid #dce2e7;min-height:60px}.verify{display:flex;align-items:center;gap:16px;margin-top:24px;border-top:1px solid #dce2e7;padding-top:16px}.verify img{width:110px;height:110px}.footer{margin-top:26px;color:#64717d;font-size:12px}@media print{body{background:#fff}.sheet{margin:0;max-width:none;border:0;padding:12mm;box-shadow:none}.no-print{display:none}table{page-break-inside:auto}tr{page-break-inside:avoid}}
      </style></head><body><main class="sheet"><header class="head"><div><div class="brand">طبيبي</div><div class="clinic">${this.escapeHtml(doctor.clinicName)}</div><div class="muted">${this.escapeHtml(doctor.fullName)} — ${this.escapeHtml(doctor.specialty)}</div><div class="muted">${this.escapeHtml(doctor.address)}، ${this.escapeHtml(doctor.city)}</div><div class="muted">${this.escapeHtml(doctor.contactPhone || '')}</div></div><div class="muted">نظام طبيبي الإلكتروني<br>مستند طبي خاص</div></header><h1 class="title">وصفة طبية</h1><div class="meta"><div><b>رقم الوصفة:</b><br>${this.escapeHtml(record.id)}</div><div><b>تاريخ الإصدار:</b><br>${this.escapeHtml(issuedAt)}</div><div><b>صالحة لغاية:</b><br>${this.escapeHtml(validUntil)}</div></div><table><thead><tr><th>#</th><th>الدواء</th><th>التركيز</th><th>الجرعة</th><th>التكرار</th><th>المدة</th><th>التعليمات</th></tr></thead><tbody>${medications}</tbody></table><section class="notes"><b>تعليمات عامة:</b><p>${this.escapeHtml(prescription.generalInstructions || 'لا توجد تعليمات إضافية')}</p></section><div class="verify"><img src="${qr}" alt="رمز التحقق"><div><b>التحقق من صحة الوصفة</b><p>امسح رمز QR للتحقق من صلاحية المستند وبيانات الجهة المصدرة. لا تعرض صفحة التحقق بيانات المريض أو تفاصيل العلاج.</p><small>${this.escapeHtml(verifyUrl)}</small></div></div><div class="footer">هذه نسخة إلكترونية صادرة من نظام طبيبي. لا تُعد بديلاً عن مراجعة الطبيب أو الصيدلي عند وجود استفسار.</div><button class="no-print" onclick="window.print()">طباعة / حفظ PDF</button></main></body></html>`;
  }

  async verifyPrescriptionToken(token: string) {
    if (!/^[a-f0-9]{64}$/i.test(token)) throw new NotFoundException('رمز التحقق غير صالح');
    const prescription = await this.dataSource.getRepository(MedicalPrescription)
      .createQueryBuilder('p').addSelect('p.verificationToken')
      .where('p.verificationToken = :token', { token }).getOne();
    if (!prescription) throw new NotFoundException('تعذر التحقق من الوصفة');
    const record = await this.records.findOne({ where: { id: prescription.recordId, deletedAt: IsNull() } });
    if (!record) throw new NotFoundException('الوصفة غير فعالة');
    const doctor = await this.doctors.findOne({ where: { userId: prescription.doctorUserId, status: DoctorProfileStatus.APPROVED } });
    if (!doctor) throw new NotFoundException('تعذر التحقق من الجهة المصدرة');
    const expired = !!prescription.validUntil && new Date(prescription.validUntil).getTime() < Date.now();
    return { valid: !expired, status: expired ? 'expired' : 'valid', documentType: 'prescription', issuer: doctor.fullName, specialty: doctor.specialty,
      clinicName: doctor.clinicName, issuedAt: prescription.createdAt, validUntil: prescription.validUntil,
      privacy: 'لا يتم عرض اسم المريض أو الأدوية أو تفاصيله الطبية عبر خدمة التحقق العامة' };
  }

}
