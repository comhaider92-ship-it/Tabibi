import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
@Entity({ name: 'notification_preferences' })
export class NotificationPreference {
  @PrimaryColumn({ type: 'uuid' }) userId: string;
  @Column({ type: 'boolean', default: true }) pushEnabled: boolean;
  @Column({ type: 'boolean', default: true }) remindersEnabled: boolean;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
