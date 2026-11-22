import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
export enum FacilitySlotStatus { AVAILABLE='available', BOOKED='booked', CLOSED='closed', CANCELLED='cancelled' }
@Entity({name:'facility_availability_slots'})
@Index('uq_facility_service_slot_start',['facilityId','serviceId','startsAt'],{unique:true})
@Index('ix_facility_slots_public_lookup',['facilityId','serviceId','status','startsAt'])
export class FacilityAvailabilitySlot {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) facilityId:string;
 @Column({type:'uuid'}) serviceId:string;
 @Column({type:'timestamptz'}) startsAt:Date;
 @Column({type:'timestamptz'}) endsAt:Date;
 @Column({type:'varchar',length:16,default:FacilitySlotStatus.AVAILABLE}) status:FacilitySlotStatus;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
}
