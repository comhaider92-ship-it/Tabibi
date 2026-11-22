import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ClinicalReportSection = { heading: string; body: string };

@Entity({ name: 'medical_clinical_reports' })
@Index('uq_medical_clinical_reports_record', ['recordId'], { unique: true })
@Index('ix_medical_clinical_reports_patient_created', ['patientUserId', 'createdAt'])
export class MedicalClinicalReport {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) recordId: string;
  @Column({ type: 'uuid' }) patientUserId: string;
  @Column({ type: 'uuid' }) doctorUserId: string;
  @Column({ type: 'uuid' }) appointmentId: string;
  @Column({ type: 'varchar', length: 24 }) reportKind: string;
  @Column({ type: 'varchar', length: 180 }) title: string;
  @Column({ type: 'text' }) summary: string;
  @Column({ type: 'jsonb' }) sections: ClinicalReportSection[];
  @Column({ type: 'text', nullable: true }) recommendations: string | null;
  @Column({ type: 'text', nullable: true }) followUpPlan: string | null;
  @Column({ type: 'date', nullable: true }) nextReviewDate: string | null;
  @Column({ type: 'varchar', length: 64, nullable: true, select: false }) verificationToken: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
