import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'notification_device_tokens' })
@Index('uq_notification_device_token', ['token'], { unique: true })
@Index('ix_notification_device_user_active', ['userId', 'isActive'])
export class NotificationDeviceToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'text' }) token: string;
  @Column({ type: 'varchar', length: 16 }) platform: 'android' | 'ios' | 'web';
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
