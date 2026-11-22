import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum DoctorSubscriptionStatus { PENDING='pending', ACTIVE='active', REJECTED='rejected', EXPIRED='expired' }
@Entity({name:'doctor_subscriptions'})
@Index('ix_doctor_subscriptions_doctor_status_expiry',['doctorId','status','expiresAt'])
export class DoctorSubscription {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) doctorId:string;
 @Column({type:'integer'}) durationDays:number;
 @Column({type:'integer'}) amountIqd:number;
 @Column({type:'varchar',length:16,default:DoctorSubscriptionStatus.PENDING}) status:DoctorSubscriptionStatus;
 @Column({type:'boolean',default:true}) requiresOwnerApproval:boolean;
 @Column({type:'varchar',length:120,nullable:true}) transferReference:string|null;
 @Column({type:'text',nullable:true}) proofUrl:string|null;
 @Column({type:'text',nullable:true}) doctorNote:string|null;
 @Column({type:'text',nullable:true}) reviewNote:string|null;
 @Column({type:'timestamptz',nullable:true}) startsAt:Date|null;
 @Column({type:'timestamptz',nullable:true}) expiresAt:Date|null;
 @Column({type:'uuid',nullable:true}) reviewedBy:string|null;
 @Column({type:'timestamptz',nullable:true}) reviewedAt:Date|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
