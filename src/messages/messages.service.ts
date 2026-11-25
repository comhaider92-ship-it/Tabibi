import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingMessage } from './message.entity';
import { Appointment } from '../appointments/appointment.entity';
import { FacilityBooking } from '../facilities/facility-booking.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { User, UserRole } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { BookingConversationMute } from './conversation-mute.entity';
import { BookingMessageReport } from './message-report.entity';

@Injectable()
export class MessagesService {
 constructor(
  @InjectRepository(BookingMessage) private readonly messages:Repository<BookingMessage>,
  @InjectRepository(Appointment) private readonly appointments:Repository<Appointment>,
  @InjectRepository(FacilityBooking) private readonly facilityBookings:Repository<FacilityBooking>,
  @InjectRepository(MedicalFacility) private readonly facilities:Repository<MedicalFacility>,
  @InjectRepository(User) private readonly users:Repository<User>,
  @InjectRepository(BookingConversationMute) private readonly mutes:Repository<BookingConversationMute>,
  @InjectRepository(BookingMessageReport) private readonly reports:Repository<BookingMessageReport>,
  private readonly notifications:NotificationsService,
 ){}
 private async appointmentParticipants(id:string,userId:string,role:UserRole){
  const booking=await this.appointments.findOne({where:{id}});if(!booking)throw new NotFoundException('الحجز غير موجود');
  const allowed=role===UserRole.PATIENT?booking.bookedByUserId===userId:role===UserRole.DOCTOR?booking.doctorId===userId:false;
  if(!allowed)throw new ForbiddenException('لا تملك صلاحية مراسلة أطراف هذا الحجز');
  return {booking,recipientId:role===UserRole.PATIENT?booking.doctorId:booking.bookedByUserId};
 }
 private async facilityParticipants(id:string,userId:string,role:UserRole){
  const booking=await this.facilityBookings.findOne({where:{id}});if(!booking)throw new NotFoundException('الحجز غير موجود');
  const facility=await this.facilities.findOne({where:{id:booking.facilityId}});if(!facility)throw new NotFoundException('المنشأة غير موجودة');
  const allowed=role===UserRole.PATIENT?booking.bookedByUserId===userId:role===UserRole.OWNER?facility.ownerUserId===userId:false;
  if(!allowed)throw new ForbiddenException('لا تملك صلاحية مراسلة أطراف هذا الحجز');
  return {booking,recipientId:role===UserRole.PATIENT?facility.ownerUserId:booking.bookedByUserId};
 }
 private async listFor(participant:{appointmentId?:string;facilityBookingId?:string},userId:string){
  const where:any=participant.appointmentId?{appointmentId:participant.appointmentId}:{facilityBookingId:participant.facilityBookingId};
  const rows=await this.messages.find({where,order:{createdAt:'ASC'},take:200});
  const unread=rows.filter(m=>m.recipientUserId===userId&&!m.readAt);
  if(unread.length){await this.messages.update(unread.map(m=>m.id),{readAt:new Date()});unread.forEach(m=>m.readAt=new Date());}
  const senderIds=[...new Set(rows.map(m=>m.senderUserId))];const senders=senderIds.length?await this.users.find({where:senderIds.map(id=>({id})),select:{id:true,displayName:true,role:true}}):[];
  const names=new Map(senders.map(s=>[s.id,{displayName:s.displayName,role:s.role}]));
  const mute=await this.mutes.findOne({where:{userId, ...(participant.appointmentId?{appointmentId:participant.appointmentId}:{facilityBookingId:participant.facilityBookingId})}});
  return {items:rows.map(m=>({...m,sender:names.get(m.senderUserId)??null})),canSend:true,muted:!!mute,unreadCount:unread.length};
 }
 async listAppointment(id:string,user:{sub:string;role:UserRole}){await this.appointmentParticipants(id,user.sub,user.role);return this.listFor({appointmentId:id},user.sub);}
 async sendAppointment(id:string,user:{sub:string;role:UserRole},body:string){const {recipientId}=await this.appointmentParticipants(id,user.sub,user.role);return this.save({appointmentId:id,facilityBookingId:null,senderUserId:user.sub,recipientUserId:recipientId},body);}
 async listFacility(id:string,user:{sub:string;role:UserRole}){await this.facilityParticipants(id,user.sub,user.role);return this.listFor({facilityBookingId:id},user.sub);}
 async sendFacility(id:string,user:{sub:string;role:UserRole},body:string){const {recipientId}=await this.facilityParticipants(id,user.sub,user.role);return this.save({appointmentId:null,facilityBookingId:id,senderUserId:user.sub,recipientUserId:recipientId},body);}
 private async save(data:Partial<BookingMessage>,body:string){const clean=body.trim();if(!clean)throw new BadRequestException('اكتب نص الرسالة أولاً');if(clean.length>1000)throw new BadRequestException('الرسالة أطول من الحد المسموح');const message=await this.messages.save(this.messages.create({...data,body:clean,readAt:null}));const sender=await this.users.findOne({where:{id:message.senderUserId},select:{id:true,displayName:true,role:true}});const mute=await this.mutes.findOne({where:{userId:message.recipientUserId,...(message.appointmentId?{appointmentId:message.appointmentId}:{facilityBookingId:message.facilityBookingId})}});if(!mute)await this.notifications.createAndDispatch({userId:message.recipientUserId,type:NotificationType.BOOKING_MESSAGE_RECEIVED,title:'رسالة جديدة بخصوص حجزك',body:'لديك رسالة جديدة بخصوص أحد حجوزاتك. افتح تطبيق طبيبي لقراءتها.',data:{messageId:message.id,...(message.appointmentId?{appointmentId:message.appointmentId}:{facilityBookingId:message.facilityBookingId}),kind:message.appointmentId?'doctor':'facility'}});return {...message,sender:sender?{displayName:sender.displayName,role:sender.role}:null};}
 async setMute(kind:'doctor'|'facility',id:string,user:{sub:string;role:UserRole},muted:boolean){
  if(kind==='doctor')await this.appointmentParticipants(id,user.sub,user.role);else await this.facilityParticipants(id,user.sub,user.role);
  const where={userId:user.sub,...(kind==='doctor'?{appointmentId:id}:{facilityBookingId:id})};
  const existing=await this.mutes.findOne({where});
  if(muted&&!existing)await this.mutes.save(this.mutes.create({...where,appointmentId:kind==='doctor'?id:null,facilityBookingId:kind==='facility'?id:null}));
  if(!muted&&existing)await this.mutes.delete(existing.id);
  return {muted};
 }
 async unreadCount(kind:'doctor'|'facility',id:string,user:{sub:string;role:UserRole}){
  if(kind==='doctor')await this.appointmentParticipants(id,user.sub,user.role);else await this.facilityParticipants(id,user.sub,user.role);
  return {unreadCount:await this.messages.count({where:{...(kind==='doctor'?{appointmentId:id}:{facilityBookingId:id}),recipientUserId:user.sub,readAt:null}})};
 }
 async reportMessage(messageId:string,user:{sub:string;role:UserRole},reason:string){
  const message=await this.messages.findOne({where:{id:messageId}});if(!message)throw new NotFoundException('الرسالة غير موجودة');
  if(message.appointmentId)await this.appointmentParticipants(message.appointmentId,user.sub,user.role);else if(message.facilityBookingId)await this.facilityParticipants(message.facilityBookingId,user.sub,user.role);
  if(message.recipientUserId!==user.sub)throw new ForbiddenException('يمكنك الإبلاغ عن الرسائل الواردة إليك فقط');
  if(!reason.trim())throw new BadRequestException('اكتب سبب البلاغ');
  const existing=await this.reports.findOne({where:{messageId,reporterUserId:user.sub}});if(existing)throw new ConflictException('سبق أن أبلغت عن هذه الرسالة');
  const report=await this.reports.save(this.reports.create({messageId,reporterUserId:user.sub,reason:reason.trim(),status:'pending',ownerNote:null}));
  await this.notifications.notifyOwners({type:NotificationType.OWNER_MESSAGE_REPORT_PENDING,title:'بلاغ جديد عن رسالة',body:'يوجد بلاغ جديد يحتاج إلى مراجعة من لوحة المالك',data:{reportId:report.id,screen:'OwnerMessageReports'}});
  return report;
 }
 async ownerReports(){
  const rows=await this.reports.find({order:{createdAt:'DESC'},take:200});
  const messageIds=[...new Set(rows.map(r=>r.messageId))];const messages=messageIds.length?await this.messages.find({where:messageIds.map(id=>({id}))}):[];
  const userIds=[...new Set([...rows.map(r=>r.reporterUserId),...messages.map(m=>m.senderUserId)])];const users=userIds.length?await this.users.find({where:userIds.map(id=>({id})),select:{id:true,displayName:true,role:true}}):[];
  const userMap=new Map(users.map(u=>[u.id,{displayName:u.displayName,role:u.role}]));const messageMap=new Map(messages.map(m=>[m.id,m]));
  return rows.map(r=>{const m=messageMap.get(r.messageId);return {...r,reporter:userMap.get(r.reporterUserId)??null,reportedMessage:m?{id:m.id,body:m.body,createdAt:m.createdAt,sender:userMap.get(m.senderUserId)??null,appointmentId:m.appointmentId,facilityBookingId:m.facilityBookingId}:null};});
 }
 async reviewReport(id:string,status:'reviewed'|'dismissed',ownerNote?:string){const row=await this.reports.findOne({where:{id}});if(!row)throw new NotFoundException('البلاغ غير موجود');row.status=status;row.ownerNote=ownerNote?.trim()||null;return this.reports.save(row);}

}
