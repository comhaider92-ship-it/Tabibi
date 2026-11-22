import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medical_record_access_logs' })
@Index('ix_medical_record_access_patient_created', ['patientUserId', 'createdAt'])
@Index('ix_medical_record_access_record_created', ['recordId', 'createdAt'])
export class MedicalRecordAccessLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) patientUserId: string;
  @Column({ type: 'uuid', nullable: true }) recordId: string | null;
  @Column({ type: 'uuid' }) actorUserId: string;
  @Column({ type: 'varchar', length: 16 }) actorRole: string;
  @Column({ type: 'varchar', length: 32 }) action: string;
  @Column({ type: 'uuid', nullable: true }) appointmentId: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
