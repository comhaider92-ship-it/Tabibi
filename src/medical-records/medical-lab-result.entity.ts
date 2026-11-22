import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medical_lab_results' })
@Index('uq_medical_lab_results_record', ['recordId'], { unique: true })
export class MedicalLabResult {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) recordId: string;
  @Column({ type: 'uuid' }) patientUserId: string;
  @Column({ type: 'uuid' }) doctorUserId: string;
  @Column({ type: 'uuid' }) appointmentId: string;
  @Column({ type: 'varchar', length: 160 }) testName: string;
  @Column({ type: 'text' }) resultValue: string;
  @Column({ type: 'varchar', length: 40, nullable: true }) unit: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) referenceRange: string | null;
  @Column({ type: 'varchar', length: 24, default: 'not_interpreted' }) interpretation: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) laboratoryName: string | null;
  @Column({ type: 'date', nullable: true }) performedOn: string | null;
  @Column({ type: 'text', nullable: true }) clinicalComment: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
