import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export enum DoctorProfileStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ name: 'doctor_profiles' })
@Index('uq_doctor_profiles_user', ['userId'], { unique: true })
@Index('ix_doctor_profiles_status_specialty', ['status', 'specialty'])
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'varchar', length: 160 }) fullName: string;
  @Column({ type: 'varchar', length: 120 }) specialty: string;
  @Column({ type: 'varchar', length: 180, nullable: true }) subSpecialty: string | null;
  @Column({ type: 'text', nullable: true }) qualifications: string | null;
  @Column({ type: 'smallint', default: 0 }) experienceYears: number;
  @Column({ type: 'text', nullable: true }) bio: string | null;
  @Column({ type: 'varchar', length: 180 }) clinicName: string;
  @Column({ type: 'varchar', length: 220 }) address: string;
  @Column({ type: 'varchar', length: 80 }) city: string;
  @Column({ type: 'varchar', length: 32, nullable: true }) contactPhone: string | null;
  @Column({ type: 'text', nullable: true }) photoUrl: string | null;
  @Column({ type: 'varchar', length: 16, default: DoctorProfileStatus.DRAFT }) status: DoctorProfileStatus;
  @Column({ type: 'text', nullable: true }) reviewNote: string | null;
  @Column({ type: 'uuid', nullable: true }) reviewedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) reviewedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
