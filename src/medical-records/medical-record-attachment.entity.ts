import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medical_record_attachments' })
@Index('uq_medical_record_attachment_asset', ['uploadAssetId'], { unique: true })
@Index('ix_medical_record_attachments_record', ['recordId', 'createdAt'])
export class MedicalRecordAttachment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) recordId: string;
  @Column({ type: 'uuid' }) uploadAssetId: string;
  @Column({ type: 'uuid' }) attachedByUserId: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
