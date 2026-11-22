import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_REMINDER_24H = 'appointment_reminder_24h',
  APPOINTMENT_REMINDER_2H = 'appointment_reminder_2h',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  APPOINTMENT_NO_SHOW = 'appointment_no_show',
  FACILITY_BOOKING_REQUESTED = 'facility_booking_requested',
  FACILITY_BOOKING_CONFIRMED = 'facility_booking_confirmed',
  FACILITY_BOOKING_REJECTED = 'facility_booking_rejected',
  FACILITY_BOOKING_CANCELLED = 'facility_booking_cancelled',
  OWNER_DOCTOR_PROFILE_PENDING = 'owner_doctor_profile_pending',
  OWNER_SUBSCRIPTION_PENDING = 'owner_subscription_pending',
  BOOKING_MESSAGE_RECEIVED = 'booking_message_received',
  OWNER_MESSAGE_REPORT_PENDING = 'owner_message_report_pending',
}

@Entity({ name: 'notifications' })
@Index('ix_notifications_user_created', ['userId', 'createdAt'])
@Index('ix_notifications_user_read_created', ['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'uuid', nullable: true }) appointmentId: string | null;
  @Column({ type: 'varchar', length: 40 }) type: NotificationType;
  @Column({ type: 'varchar', length: 180 }) title: string;
  @Column({ type: 'text' }) body: string;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) data: Record<string, unknown>;
  @Column({ type: 'boolean', default: false }) isRead: boolean;
  @Column({ type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
