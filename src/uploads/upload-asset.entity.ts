import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum UploadCategory {
  DOCTOR_PHOTO = 'doctor_photo',
  DOCTOR_QUALIFICATION = 'doctor_qualification',
  FACILITY_IMAGE = 'facility_image',
  FACILITY_DOCUMENT = 'facility_document',
  MEDICAL_ATTACHMENT = 'medical_attachment',
}

@Entity({ name: 'upload_assets' })
@Index('ix_upload_assets_owner_category', ['ownerUserId', 'category'])
@Index('ix_upload_assets_facility', ['facilityId'])
export class UploadAsset {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) ownerUserId: string;
  @Column({ type: 'uuid', nullable: true }) facilityId: string | null;
  @Column({ type: 'varchar', length: 32 }) category: UploadCategory;
  @Column({ type: 'varchar', length: 100 }) originalName: string;
  @Column({ type: 'varchar', length: 80 }) mimeType: string;
  @Column({ type: 'varchar', length: 180, unique: true }) storageKey: string;
  @Column({ type: 'integer' }) sizeBytes: number;
  @Column({ type: 'boolean', default: false }) isPublic: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
