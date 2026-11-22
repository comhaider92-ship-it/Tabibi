import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AppointmentStatus } from './appointment.entity';
@Entity({ name: 'appointment_status_history' })
@Index('ix_appointment_status_history_appointment_created', ['appointmentId', 'createdAt'])
export class AppointmentStatusHistory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) appointmentId: string;
  @Column({ type: 'varchar', length: 24, nullable: true }) fromStatus: AppointmentStatus | null;
  @Column({ type: 'varchar', length: 24 }) toStatus: AppointmentStatus;
  @Column({ type: 'uuid' }) changedByUserId: string;
  @Column({ type: 'varchar', length: 16 }) changedByRole: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) reason: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
