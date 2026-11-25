import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({name:'booking_messages'})
@Index('ix_booking_messages_appointment_created',['appointmentId','createdAt'])
@Index('ix_booking_messages_facility_booking_created',['facilityBookingId','createdAt'])
@Check('("appointmentId" IS NOT NULL AND "facilityBookingId" IS NULL) OR ("appointmentId" IS NULL AND "facilityBookingId" IS NOT NULL)')
export class BookingMessage {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid',nullable:true}) appointmentId:string|null;
 @Column({type:'uuid',nullable:true}) facilityBookingId:string|null;
 @Column({type:'uuid'}) senderUserId:string;
 @Column({type:'uuid'}) recipientUserId:string;
 @Column({type:'varchar',length:1000}) body:string;
 @Column({type:'timestamptz',nullable:true}) readAt:Date|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
}
