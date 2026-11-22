import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { WeeklyScheduleOwnerType } from './weekly-schedule.entity';

@Entity({ name: 'schedule_exceptions' })
@Index('ix_schedule_exception_owner_range', ['ownerType', 'ownerId', 'isActive', 'startsAt', 'endsAt'])
export class ScheduleException {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 16 }) ownerType: WeeklyScheduleOwnerType;
  @Column({ type: 'uuid' }) ownerId: string;
  @Column({ type: 'uuid', nullable: true }) serviceId: string | null;
  @Column({ type: 'timestamptz' }) startsAt: Date;
  @Column({ type: 'timestamptz' }) endsAt: Date;
  @Column({ type: 'varchar', length: 64, default: 'Asia/Baghdad' }) timezone: string;
  @Column({ type: 'varchar', length: 240, nullable: true }) reason: string | null;
  @Column({ type: 'uuid', array: true, default: () => "'{}'::uuid[]" }) affectedSlotIds: string[];
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
