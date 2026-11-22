import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { IsNull, Repository } from 'typeorm';
import { DoctorProfile, DoctorProfileStatus } from '../doctors/doctor-profile.entity';
import { MedicalFacility, FacilityStatus } from '../facilities/facility.entity';
import { UploadAsset, UploadCategory } from './upload-asset.entity';
import { CreateUploadDto } from './dto/create-upload.dto';
import { MedicalRecordAttachment } from '../medical-records/medical-record-attachment.entity';
import { MedicalRecordShareConsent } from '../medical-records/medical-record-share-consent.entity';
import { MedicalRecord } from '../medical-records/medical-record.entity';
import { MedicalRecordAccessLog } from '../medical-records/medical-record-access-log.entity';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf',
};
const IMAGE_CATEGORIES = [UploadCategory.DOCTOR_PHOTO, UploadCategory.FACILITY_IMAGE];

@Injectable()
export class UploadsService {
  private readonly root = resolve(process.env.UPLOADS_DIRECTORY || './private-uploads');
  constructor(
    @InjectRepository(UploadAsset) private readonly assets: Repository<UploadAsset>,
    @InjectRepository(MedicalFacility) private readonly facilities: Repository<MedicalFacility>,
    @InjectRepository(DoctorProfile) private readonly doctors: Repository<DoctorProfile>,
    @InjectRepository(MedicalRecordAttachment) private readonly medicalAttachments: Repository<MedicalRecordAttachment>,
    @InjectRepository(MedicalRecordShareConsent) private readonly shareConsents: Repository<MedicalRecordShareConsent>,
    @InjectRepository(MedicalRecord) private readonly medicalRecords: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordAccessLog) private readonly medicalLogs: Repository<MedicalRecordAccessLog>,
  ) {}

  async create(userId: string, role: string, dto: CreateUploadDto) {
    const category = dto.category;
    if (category === UploadCategory.MEDICAL_ATTACHMENT) {
      if (role !== 'patient' || dto.facilityId) throw new ForbiddenException('المرفقات الطبية مخصصة للمريض فقط');
    } else if (category === UploadCategory.DOCTOR_PHOTO || category === UploadCategory.DOCTOR_QUALIFICATION) {
      if (role !== 'doctor') throw new ForbiddenException('هذا النوع مخصص لحساب الطبيب');
      if (dto.facilityId) throw new BadRequestException('لا يمكن ربط وثائق الطبيب بمنشأة من هذا الطلب');
      if (!await this.doctors.findOne({ where: { userId } })) throw new NotFoundException('أنشئ ملف الطبيب أولاً');
    } else {
      if (role !== 'owner' || !dto.facilityId) throw new ForbiddenException('هذا النوع مخصص لمالك المنشأة');
      const facility = await this.facilities.findOne({ where: { id: dto.facilityId, ownerUserId: userId } });
      if (!facility) throw new NotFoundException('المنشأة غير موجودة ضمن حسابك');
    }

    const expectedImage = IMAGE_CATEGORIES.includes(category);
    const isMedicalAttachment = category === UploadCategory.MEDICAL_ATTACHMENT;
    // Profile images must be real image formats only; PDFs are reserved for private medical attachments and official documents.
    const allowedMime = expectedImage
      ? ['image/jpeg', 'image/png', 'image/webp']
      : isMedicalAttachment
        ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        : ['application/pdf'];
    if (!allowedMime.includes(dto.mimeType)) throw new BadRequestException('نوع الملف غير مسموح لهذه الفئة');
    const maxBytes = expectedImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    // Validate encoded length and alphabet before decoding to limit memory use and reject permissive base64 parsing.
    const maxBase64Length = 4 * Math.ceil(maxBytes / 3);
    if (typeof dto.base64 !== 'string' || !dto.base64.length || dto.base64.length > maxBase64Length ||
        dto.base64.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(dto.base64)) {
      throw new BadRequestException('ترميز الملف غير صالح أو يتجاوز الحجم المسموح');
    }
    const buffer = Buffer.from(dto.base64, 'base64');
    if (!buffer.length || buffer.length > maxBytes || buffer.toString('base64') !== dto.base64) {
      throw new BadRequestException(`حجم الملف يجب ألا يتجاوز ${expectedImage ? 5 : 10} ميغابايت أو أن ترميزه غير صالح`);
    }
    if (!this.matchesSignature(buffer, dto.mimeType)) throw new BadRequestException('محتوى الملف لا يطابق نوعه المعلن');

    const id = randomUUID();
    const storageKey = `${id}${MIME_EXT[dto.mimeType]}`;
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    await writeFile(join(this.root, storageKey), buffer, { flag: 'wx', mode: 0o600 });
    let saved: UploadAsset | null = null;
    try {
      const asset = this.assets.create({
        ownerUserId: userId, facilityId: dto.facilityId || null, category,
        originalName: dto.fileName.replace(/[\\/\r\n\0]/g, '_').slice(0, 100),
        mimeType: dto.mimeType, storageKey, sizeBytes: buffer.length,
        isPublic: expectedImage,
      });
      saved = await this.assets.save(asset);
      const url = saved.isPublic ? `/api/v1/uploads/public/${saved.id}` : null;
      if (category === UploadCategory.DOCTOR_PHOTO && url) await this.doctors.update({ userId }, { photoUrl: url });
      if (category === UploadCategory.FACILITY_IMAGE && url && dto.facilityId) await this.facilities.update({ id: dto.facilityId, ownerUserId: userId }, { imageUrl: url });
      return { id: saved.id, category: saved.category, mimeType: saved.mimeType, sizeBytes: saved.sizeBytes,
        isPublic: saved.isPublic, url, createdAt: saved.createdAt };
    } catch (error) {
      if (saved) await this.assets.delete({ id: saved.id }).catch(() => undefined);
      const { unlink } = await import('fs/promises');
      await unlink(join(this.root, storageKey)).catch(() => undefined);
      throw error;
    }
  }

  async mine(userId: string) {
    const rows = await this.assets.find({ where: { ownerUserId: userId }, order: { createdAt: 'DESC' }, take: 100 });
    return rows.map(({ id, category, originalName, mimeType, sizeBytes, isPublic, facilityId, createdAt }) => ({
      id, category, originalName, mimeType, sizeBytes, isPublic, facilityId, createdAt,
      url: isPublic ? `/api/v1/uploads/public/${id}` : null,
    }));
  }

  async ownerReviewQueue() {
    const rows = await this.assets.find({
      where: [{ category: UploadCategory.DOCTOR_QUALIFICATION }, { category: UploadCategory.FACILITY_DOCUMENT }],
      order: { createdAt: 'ASC' }, take: 200,
    });
    const eligible = await Promise.all(rows.map(async asset => ({ asset, pending: await this.isPendingReviewAsset(asset) })));
    return eligible.filter(row => row.pending).map(({ asset }) => ({
      id: asset.id, ownerUserId: asset.ownerUserId, facilityId: asset.facilityId, category: asset.category,
      originalName: asset.originalName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, createdAt: asset.createdAt,
      downloadUrl: `/api/v1/uploads/${asset.id}/download`,
    }));
  }

  async getFile(id: string, userId: string, role: string, publicOnly = false) {
    const asset = await this.assets.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('الملف غير موجود');
    if (publicOnly && !asset.isPublic) throw new NotFoundException('الملف غير موجود');
    if (publicOnly && !(await this.isPubliclyApproved(asset))) throw new NotFoundException('الملف غير موجود');
    if (!publicOnly) {
      const doctorOwnedCategory = asset.category === UploadCategory.DOCTOR_PHOTO || asset.category === UploadCategory.DOCTOR_QUALIFICATION;
      const facilityOwnedCategory = asset.category === UploadCategory.FACILITY_IMAGE || asset.category === UploadCategory.FACILITY_DOCUMENT;
      const medicalAttachment = asset.category === UploadCategory.MEDICAL_ATTACHMENT;
      const ownsAsset = asset.ownerUserId === userId;
      const roleMatchesAsset = (doctorOwnedCategory && role === 'doctor') || (facilityOwnedCategory && role === 'owner') || (medicalAttachment && role === 'patient');
      if (ownsAsset && !roleMatchesAsset) throw new ForbiddenException('نوع الحساب لا يملك صلاحية هذا النوع من الملفات');
      if (medicalAttachment && !ownsAsset) {
        const link = await this.medicalAttachments.findOne({ where: { uploadAssetId: asset.id } });
        if (role !== 'doctor' || !link) throw new ForbiddenException('لا تملك صلاحية الوصول لهذا المرفق');
        const doctor = await this.doctors.findOne({ where: { userId, status: DoctorProfileStatus.APPROVED } });
        if (!doctor) throw new ForbiddenException('حساب الطبيب غير معتمد حالياً');
        const record = await this.medicalRecords.findOne({ where: { id: link.recordId, patientUserId: asset.ownerUserId, deletedAt: IsNull() } });
        if (!record) throw new NotFoundException('المرفق الطبي غير متاح');
        const consent = await this.shareConsents.createQueryBuilder('c')
          .where('c.patientUserId = :patientId', { patientId: asset.ownerUserId })
          .andWhere('c.doctorUserId = :doctorId', { doctorId: userId })
          .andWhere('c.revokedAt IS NULL AND c.expiresAt > NOW()')
          .andWhere(':recordId = ANY(c.recordIds)', { recordId: link.recordId })
          .andWhere('c.allowDownload = true').getOne();
        if (!consent) throw new ForbiddenException('موافقة المريض لا تسمح بتنزيل هذا المرفق');
      } else if (!ownsAsset && (role !== 'owner' || !(await this.isPendingReviewAsset(asset)))) {
        throw new ForbiddenException('لا تملك صلاحية الوصول لهذا الملف');
      }
    }
    const path = resolve(this.root, asset.storageKey);
    if (!path.startsWith(`${this.root}${sep}`)) throw new ForbiddenException('مسار الملف غير صالح');
    const buffer = await readFile(path);
    if (!publicOnly && asset.category === UploadCategory.MEDICAL_ATTACHMENT) {
      const link = await this.medicalAttachments.findOne({ where: { uploadAssetId: asset.id } });
      if (link) {
        const record = await this.medicalRecords.findOne({ where: { id: link.recordId } });
        if (record) await this.medicalLogs.save(this.medicalLogs.create({ patientUserId: asset.ownerUserId, recordId: record.id,
          actorUserId: userId, actorRole: role, action: 'attachment_download', appointmentId: record.appointmentId }));
      }
    }
    return { asset, buffer };
  }

  private async isPubliclyApproved(asset: UploadAsset) {
    // Public access is limited to the currently selected profile/facility image.
    // Older images remain private after an image is replaced.
    if (!asset.isPublic) return false;
    const expectedUrl = `/api/v1/uploads/public/${asset.id}`;
    if (asset.category === UploadCategory.DOCTOR_PHOTO) {
      const doctor = await this.doctors.findOne({ where: { userId: asset.ownerUserId } });
      return doctor?.status === DoctorProfileStatus.APPROVED && doctor.photoUrl === expectedUrl;
    }
    if (asset.category === UploadCategory.FACILITY_IMAGE && asset.facilityId) {
      const facility = await this.facilities.findOne({ where: { id: asset.facilityId, ownerUserId: asset.ownerUserId } });
      return facility?.status === FacilityStatus.APPROVED && facility.imageUrl === expectedUrl;
    }
    return false;
  }

  private async isPendingReviewAsset(asset: UploadAsset) {
    if (asset.category === UploadCategory.DOCTOR_QUALIFICATION) {
      const doctor = await this.doctors.findOne({ where: { userId: asset.ownerUserId } });
      return doctor?.status === DoctorProfileStatus.PENDING;
    }
    if (asset.category === UploadCategory.FACILITY_DOCUMENT && asset.facilityId) {
      const facility = await this.facilities.findOne({ where: { id: asset.facilityId, ownerUserId: asset.ownerUserId } });
      return facility?.status === FacilityStatus.PENDING;
    }
    return false;
  }

  private matchesSignature(buffer: Buffer, mime: string) {
    if (mime === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mime === 'image/png') return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if (mime === 'image/webp') return buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    if (mime === 'application/pdf') return buffer.length > 5 && buffer.toString('ascii', 0, 5) === '%PDF-';
    return false;
  }
}
