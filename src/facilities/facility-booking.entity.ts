import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum FacilityBookingStatus { REQUESTED='requested', CONFIRMED='confirmed', CANCELLED='cancelled', COMPLETED='completed', REJECTED='rejected' }
@Entity({name:'facility_bookings'})
@Index('uq_facility_booking_idempotency',['idempotencyKey'],{unique:true})
@Index('ix_facility_bookings_facility_time',['facilityId','startsAt'])
export class FacilityBooking {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) facilityId:string;
 @Column({type:'uuid'}) serviceId:string;
 @Column({type:'uuid',nullable:true}) slotId:string|null;
 @Column({type:'uuid'}) bookedByUserId:string;
 @Column({type:'varchar',length:120}) patientName:string;
 @Column({type:'varchar',length:32,nullable:true}) patientPhone:string|null;
 @Column({type:'timestamptz'}) startsAt:Date;
 @Column({type:'varchar',length:20,default:FacilityBookingStatus.REQUESTED}) status:FacilityBookingStatus;
 @Column({type:'varchar',length:100}) idempotencyKey:string;
 @Column({type:'text',nullable:true}) patientNote:string|null;
 @Column({type:'varchar',length:500,nullable:true}) statusNote:string|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
