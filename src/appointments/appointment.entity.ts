import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum AppointmentStatus { CONFIRMED='confirmed',CANCELLED='cancelled',COMPLETED='completed',NO_SHOW='no_show' }
@Entity({name:'appointments'})
@Index('uq_appointments_idempotency_key',['idempotencyKey'],{unique:true})
@Check('"endsAt" > "startsAt"')
export class Appointment {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) doctorId:string;
 @Column({type:'uuid'}) bookedByUserId:string;
 @Column({type:'uuid',nullable:true}) beneficiaryId:string|null;
 @Column({type:'varchar',length:120,nullable:true}) beneficiaryName:string|null;
 @Column({type:'varchar',length:32,nullable:true}) beneficiaryPhone:string|null;
 @Column({type:'timestamptz'}) startsAt:Date;
 @Column({type:'timestamptz'}) endsAt:Date;
 @Column({type:'varchar',length:24,default:AppointmentStatus.CONFIRMED}) status:AppointmentStatus;
 @Column({type:'varchar',length:100}) idempotencyKey:string;
 @Column({type:'text',nullable:true}) patientNote:string|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
