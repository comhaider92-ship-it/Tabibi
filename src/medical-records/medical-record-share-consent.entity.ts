import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medical_record_share_consents' })
@Index('ix_medical_share_patient_doctor', ['patientUserId', 'doctorUserId', 'createdAt'])
@Index('ix_medical_share_doctor_expiry', ['doctorUserId', 'expiresAt', 'revokedAt'])
export class MedicalRecordShareConsent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) patientUserId: string;
  @Column({ type: 'uuid' }) doctorUserId: string;
  @Column({ type: 'uuid', array: true }) recordIds: string[];
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'boolean', default: false }) allowDownload: boolean;
  @Column({ type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
