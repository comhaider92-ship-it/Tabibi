import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
@Entity({name:'booking_conversation_mutes'})
@Index('ix_booking_conversation_mutes_user',['userId'])
@Check('("appointmentId" IS NOT NULL AND "facilityBookingId" IS NULL) OR ("appointmentId" IS NULL AND "facilityBookingId" IS NOT NULL)')
export class BookingConversationMute {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) userId:string;
 @Column({type:'uuid',nullable:true}) appointmentId:string|null;
 @Column({type:'uuid',nullable:true}) facilityBookingId:string|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
