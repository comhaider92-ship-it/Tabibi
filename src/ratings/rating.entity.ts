import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum RatingStatus { PUBLISHED = 'published', HIDDEN = 'hidden', UNDER_REVIEW = 'under_review' }

@Entity({ name: 'doctor_ratings' })
@Index('uq_doctor_rating_appointment', ['appointmentId'], { unique: true })
@Index('ix_doctor_rating_doctor_status_created', ['doctorId', 'status', 'createdAt'])
@Check('"stars" >= 1 AND "stars" <= 5')
export class DoctorRating {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) appointmentId: string;
  @Column({ type: 'uuid' }) doctorId: string;
  @Column({ type: 'uuid' }) patientId: string;
  @Column({ type: 'smallint' }) stars: number;
  @Column({ type: 'varchar', length: 1000, nullable: true }) comment: string | null;
  @Column({ type: 'varchar', length: 20, default: RatingStatus.PUBLISHED }) status: RatingStatus;
  @Column({ type: 'boolean', default: false }) isReported: boolean;
  @Column({ type: 'text', nullable: true }) moderationNote: string | null;
  @Column({ type: 'uuid', nullable: true }) moderatedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) moderatedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
