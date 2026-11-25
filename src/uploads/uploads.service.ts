import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { createReadStream } from 'fs';
import { mkdir, chmod, writeFile, unlink } from 'fs/promises';
import { basename, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { UploadAsset, UploadCategory } from './upload-asset.entity';
import { UserRole } from '../users/user.entity';
import { DoctorProfile, DoctorProfileStatus } from '../doctors/doctor-profile.entity';
import { MedicalFacility, FacilityStatus } from '../facilities/facility.entity';
import { MedicalRecordAttachment } from '../medical-records/medical-record-attachment.entity';
import { MedicalRecord } from '../medical-records/medical-record.entity';
import { MedicalRecordShareConsent } from '../medical-records/medical-record-share-consent.entity';

type Actor = { sub: string; role: UserRole };
@Injectable()
export class UploadsService {
  private readonly directory: string;
  constructor(
    @InjectRepository(UploadAsset) private readonly assets: Repository<UploadAsset>,
    @InjectRepository(DoctorProfile) private readonly doctors: Repository<DoctorProfile>,
    @InjectRepository(MedicalFacility) private readonly facilities: Repository<MedicalFacility>,
    @InjectRepository(MedicalRecordAttachment) private readonly attachments: Repository<MedicalRecordAttachment>,
    @InjectRepository(MedicalRecord) private readonly records: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordShareConsent) private readonly consents: Repository<MedicalRecordShareConsent>,
    private readonly config: ConfigService,
  ) {
    this.directory = resolve(this.config.get<string>('UPLOADS_DIRECTORY') || join(process.cwd(), 'private-uploads'));
  }

  private async ensureDirectory() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try { await chmod(this.directory, 0o700); } catch {}
  }

  private validateSignature(bytes: Buffer, mime: string) {
    const valid = mime === 'image/jpeg' ? bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : mime === 'image/webp' ? bytes.length > 12 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP'
      : mime === 'application/pdf' ? bytes.toString('ascii',0,5) === '%PDF-'
      : false;
    if (!valid) throw new BadRequestException('محتوى الملف لا يطابق نوعه المعلن.');
  }

  async upload(actor: Actor, input: { fileName?: string; mimeType?: string; base64?: string; category?: UploadCategory; facilityId?: string }) {
    const category = input.category;
    const allowedCategories = Object.values(UploadCategory) as string[];
    if (!category || !allowedCategories.includes(category)) throw new BadRequestException('فئة الملف غير صحيحة.');
    if (actor.role === UserRole.PATIENT && category !== UploadCategory.MEDICAL_ATTACHMENT) throw new ForbiddenException('المريض يستطيع رفع المرفقات الطبية الخاصة فقط.');
    if (actor.role === UserRole.DOCTOR && ![UploadCategory.DOCTOR_PHOTO, UploadCategory.DOCTOR_QUALIFICATION].includes(category)) throw new ForbiddenException('فئة الملف غير مسموحة للطبيب.');
    if (actor.role === UserRole.OWNER && ![UploadCategory.FACILITY_IMAGE, UploadCategory.FACILITY_DOCUMENT].includes(category)) throw new ForbiddenException('فئة الملف غير مسموحة للمالك.');
    if (actor.role === UserRole.OWNER) {
      if (!input.facilityId) throw new BadRequestException('حدد المنشأة التابعة لهذا الملف.');
      const facility = await this.facilities.findOne({ where: { id: input.facilityId, ownerUserId: actor.sub } });
      if (!facility) throw new ForbiddenException('المنشأة غير موجودة أو لا تتبع حسابك.');
    } else if (input.facilityId) throw new ForbiddenException('لا يمكن ربط هذا الملف بمنشأة أخرى.');
    const mime = String(input.mimeType || '').toLowerCase();
    const image = ['image/jpeg','image/png','image/webp'].includes(mime);
    const pdf = mime === 'application/pdf';
    const imageCategory = [UploadCategory.DOCTOR_PHOTO, UploadCategory.FACILITY_IMAGE].includes(category);
    const pdfCategory = [UploadCategory.DOCTOR_QUALIFICATION, UploadCategory.FACILITY_DOCUMENT].includes(category);
    if ((imageCategory && !image) || (pdfCategory && !pdf) || (category === UploadCategory.MEDICAL_ATTACHMENT && !image && !pdf)) throw new BadRequestException('نوع الملف غير مسموح لهذه الفئة.');
    const maxBytes = image ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!input.base64 || input.base64.length > Math.ceil(maxBytes * 4 / 3) + 16) throw new BadRequestException('حجم الملف يتجاوز الحد المسموح.');
    const bytes = Buffer.from(input.base64, 'base64');
    if (!bytes.length || bytes.length > maxBytes) throw new BadRequestException('حجم الملف يتجاوز الحد المسموح.');
    this.validateSignature(bytes, mime);
    const originalName = basename(String(input.fileName || 'file')).replace(/[\r\n"]/g, '_').slice(0,100) || 'file';
    const storageKey = randomUUID();
    await this.ensureDirectory();
    const fullPath = join(this.directory, storageKey);
    await writeFile(fullPath, bytes, { flag: 'wx', mode: 0o600 });
    try {
      const asset = await this.assets.save(this.assets.create({
        ownerUserId: actor.sub, facilityId: input.facilityId || null, category, originalName,
        mimeType: mime, storageKey, sizeBytes: bytes.length,
        isPublic: imageCategory,
      }));
      return { ...asset, url: imageCategory ? `/api/v1/uploads/public/${asset.id}` : null };
    } catch (error) {
      await unlink(fullPath).catch(() => {});
      throw error;
    }
  }

  async mine(actor: Actor) {
    return this.assets.find({ where: { ownerUserId: actor.sub }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async ownerReviewQueue(actor: Actor) {
    if (actor.role !== UserRole.OWNER) throw new ForbiddenException('هذه القائمة للمالك فقط.');
    const [doctorProfiles, facilities] = await Promise.all([
      this.doctors.find({ where: { status: DoctorProfileStatus.PENDING }, select: { userId: true } }),
      this.facilities.find({ where: { status: FacilityStatus.PENDING }, select: { id: true } }),
    ]);
    const doctorIds = doctorProfiles.map(x => x.userId);
    const facilityIds = facilities.map(x => x.id);
    const rows = await this.assets.find({ where: [
      ...(doctorIds.length ? [{ ownerUserId: require('typeorm').In(doctorIds), category: UploadCategory.DOCTOR_QUALIFICATION }] : []),
      ...(facilityIds.length ? [{ facilityId: require('typeorm').In(facilityIds), category: UploadCategory.FACILITY_DOCUMENT }] : []),
    ], order: { createdAt: 'ASC' } });
    return rows;
  }

  async getForDownload(id: string, actor: Actor) {
    const asset = await this.assets.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('الملف غير موجود.');
    let allowed = asset.ownerUserId === actor.sub;
    if (!allowed && actor.role === UserRole.OWNER && asset.category === UploadCategory.DOCTOR_QUALIFICATION) {
      const profile = await this.doctors.findOne({ where: { userId: asset.ownerUserId, status: DoctorProfileStatus.PENDING } });
      allowed = !!profile;
    }
    if (!allowed && actor.role === UserRole.OWNER && asset.category === UploadCategory.FACILITY_DOCUMENT && asset.facilityId) {
      const facility = await this.facilities.findOne({ where: { id: asset.facilityId, status: FacilityStatus.PENDING } });
      allowed = !!facility;
    }
    if (!allowed && actor.role === UserRole.DOCTOR && asset.category === UploadCategory.MEDICAL_ATTACHMENT) {
      const link = await this.attachments.findOne({ where: { uploadAssetId: asset.id } });
      const record = link ? await this.records.findOne({ where: { id: link.recordId } }) : null;
      const consent = record ? await this.consents.findOne({ where: { patientUserId: record.patientUserId, doctorUserId: actor.sub, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) } }) : null;
      allowed = !!record && !!consent && consent.allowDownload && consent.recordIds.includes(record.id);
    }
    if (!allowed) throw new ForbiddenException('لا تملك صلاحية تنزيل هذا الملف.');
    const fullPath = join(this.directory, asset.storageKey);
    return { asset, fullPath, stream: createReadStream(fullPath) };
  }

  async getPublicImage(id: string) {
    const asset = await this.assets.findOne({ where: { id, isPublic: true } });
    if (!asset || ![UploadCategory.DOCTOR_PHOTO, UploadCategory.FACILITY_IMAGE].includes(asset.category)) throw new NotFoundException('الصورة غير متاحة.');
    const approved = asset.category === UploadCategory.DOCTOR_PHOTO
      ? await this.doctors.findOne({ where: { userId: asset.ownerUserId, status: DoctorProfileStatus.APPROVED } })
      : asset.facilityId ? await this.facilities.findOne({ where: { id: asset.facilityId, status: FacilityStatus.APPROVED } }) : null;
    if (!approved) throw new NotFoundException('الصورة غير متاحة.');
    return { asset, fullPath: join(this.directory, asset.storageKey), stream: createReadStream(join(this.directory, asset.storageKey)) };
  }
}
