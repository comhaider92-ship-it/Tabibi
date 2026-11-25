import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum SlotStatus { OPEN='open', CLOSED='closed' }
@Entity({ name: 'doctor_availability_slots' })
@Index('ix_doctor_slots_doctor_start', ['doctorId','startsAt'])
@Check('"endsAt" > "startsAt"')
export class AvailabilitySlot {
 @PrimaryGeneratedColumn('uuid') id: string;
 @Column({ type:'uuid' }) doctorId: string;
 @Column({ type:'timestamptz' }) startsAt: Date;
 @Column({ type:'timestamptz' }) endsAt: Date;
 @Column({ type:'varchar', length:12, default:SlotStatus.OPEN }) status: SlotStatus;
 @Column({ type:'varchar', length:240, nullable:true }) note: string | null;
 @CreateDateColumn({ type:'timestamptz' }) createdAt: Date;
 @UpdateDateColumn({ type:'timestamptz' }) updatedAt: Date;
}
