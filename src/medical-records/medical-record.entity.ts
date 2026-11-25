import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MedicalRecordAuthorRole { PATIENT = 'patient', DOCTOR = 'doctor' }
export enum MedicalRecordType { NOTE = 'note', DIAGNOSIS = 'diagnosis', PRESCRIPTION = 'prescription', TEST_RESULT = 'test_result', VISIT_SUMMARY = 'visit_summary' }

@Entity({ name: 'medical_records' })
@Index('ix_medical_records_patient_created', ['patientUserId', 'createdAt'])
@Index('ix_medical_records_appointment', ['appointmentId'])
@Index('ix_medical_records_author', ['authorUserId'])
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) patientUserId: string;
  @Column({ type: 'uuid', nullable: true }) appointmentId: string | null;
  @Column({ type: 'uuid' }) authorUserId: string;
  @Column({ type: 'varchar', length: 16 }) authorRole: MedicalRecordAuthorRole;
  @Column({ type: 'varchar', length: 24 }) recordType: MedicalRecordType;
  @Column({ type: 'varchar', length: 160 }) title: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'timestamptz', nullable: true }) deletedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
