import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type PrescriptionMedication = {
  medicationName: string;
  strength?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

@Entity({ name: 'medical_prescriptions' })
@Index('uq_medical_prescriptions_record', ['recordId'], { unique: true })
export class MedicalPrescription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) recordId: string;
  @Column({ type: 'uuid' }) patientUserId: string;
  @Column({ type: 'uuid' }) doctorUserId: string;
  @Column({ type: 'uuid' }) appointmentId: string;
  @Column({ type: 'jsonb' }) medications: PrescriptionMedication[];
  @Column({ type: 'text', nullable: true }) generalInstructions: string | null;
  @Column({ type: 'timestamptz', nullable: true }) validUntil: Date | null;
  @Column({ type: 'varchar', length: 64, nullable: true, select: false }) verificationToken: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
