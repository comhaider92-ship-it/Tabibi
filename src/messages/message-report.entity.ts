import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
@Entity({name:'booking_message_reports'})
@Index('uq_booking_message_reports_reporter_message',['messageId','reporterUserId'],{unique:true})
@Index('ix_booking_message_reports_status_created',['status','createdAt'])
export class BookingMessageReport {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) messageId:string;
 @Column({type:'uuid'}) reporterUserId:string;
 @Column({type:'varchar',length:500}) reason:string;
 @Column({type:'varchar',length:20,default:'pending'}) status:'pending'|'reviewed'|'dismissed';
 @Column({type:'varchar',length:1000,nullable:true}) ownerNote:string|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
