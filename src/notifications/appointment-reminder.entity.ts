import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReminderStatus { PENDING = 'pending', PROCESSING = 'processing', SENT = 'sent', SKIPPED = 'skipped', FAILED = 'failed' }
@Entity({ name: 'appointment_reminders' })
@Index('uq_appointment_reminder_kind_recipient', ['appointmentId', 'recipientUserId', 'kind'], { unique: true })
@Index('ix_appointment_reminder_due', ['status', 'sendAt'])
export class AppointmentReminder {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) appointmentId: string;
  @Column({ type: 'uuid' }) recipientUserId: string;
  @Column({ type: 'varchar', length: 16 }) kind: '24h' | '2h';
  @Column({ type: 'timestamptz' }) sendAt: Date;
  @Column({ type: 'varchar', length: 16, default: ReminderStatus.PENDING }) status: ReminderStatus;
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ type: 'text', nullable: true }) lastError: string | null;
  @Column({ type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
