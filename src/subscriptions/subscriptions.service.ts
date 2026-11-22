import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { DoctorSubscription, DoctorSubscriptionStatus } from './subscription.entity';
import { OwnerAuditLog } from './audit-log.entity';
import { User, UserRole } from '../users/user.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { CreateSubscriptionRequestDto } from './dto/create-subscription-request.dto';
import { ReviewSubscriptionDto } from './dto/review-subscription.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
@Injectable()
export class SubscriptionsService {
 constructor(@InjectRepository(DoctorSubscription) private readonly subs:Repository<DoctorSubscription>,@InjectRepository(User) private readonly users:Repository<User>,@InjectRepository(DoctorProfile) private readonly profiles:Repository<DoctorProfile>,@InjectRepository(MedicalFacility) private readonly facilities:Repository<MedicalFacility>,@InjectRepository(OwnerAuditLog) private readonly logs:Repository<OwnerAuditLog>,private readonly dataSource:DataSource,private readonly notifications:NotificationsService){}
 private async audit(ownerId:string,action:string,targetType:string,targetId:string|null,details:Record<string,any>={}){await this.logs.save(this.logs.create({ownerId,action,targetType,targetId,details}));}
 async request(doctorId:string,dto:CreateSubscriptionRequestDto){
  const user=await this.users.findOne({where:{id:doctorId,role:UserRole.DOCTOR,isActive:true}});if(!user)throw new ForbiddenException('حساب الطبيب غير متاح');
  const pending=await this.subs.findOne({where:{doctorId,status:DoctorSubscriptionStatus.PENDING}});if(pending)throw new ConflictException('لديك طلب اشتراك أو تجديد قيد الإجراء');
  const priorApproved=await this.subs.findOne({where:{doctorId,status:In([DoctorSubscriptionStatus.ACTIVE,DoctorSubscriptionStatus.EXPIRED])},order:{createdAt:'DESC'}});
  const requiresOwnerApproval=!priorApproved;
  const row=this.subs.create({doctorId,durationDays:dto.durationDays,amountIqd:dto.amountIqd,status:DoctorSubscriptionStatus.PENDING,requiresOwnerApproval,transferReference:dto.transferReference?.trim()??null,proofUrl:dto.proofUrl??null,doctorNote:dto.doctorNote?.trim()??null});
  const saved=await this.subs.save(row);
  await this.notifications.notifyOwners({type:NotificationType.OWNER_SUBSCRIPTION_PENDING,title:requiresOwnerApproval?'طلب اشتراك أول مرة':'طلب تجديد اشتراك',body:requiresOwnerApproval?`أرسل الطبيب طلب اشتراك أول بمبلغ ${saved.amountIqd} دينار لمدة ${saved.durationDays} يوم ويحتاج مراجعة أهلية.`:`أرسل طبيب معتمد طلب تجديد بمبلغ ${saved.amountIqd} دينار لمدة ${saved.durationDays} يوم؛ المطلوب التحقق من وصول الدفعة فقط.`,data:{event:requiresOwnerApproval?'owner_subscription_pending':'owner_renewal_payment_pending',subscriptionId:saved.id,doctorId:saved.doctorId,screen:'OwnerSubscriptions'}});
  return {...saved,renewal:!requiresOwnerApproval,paymentVerificationRequired:!requiresOwnerApproval};
 }
 mySubscriptions(doctorId:string){return this.subs.find({where:{doctorId},order:{createdAt:'DESC'},take:30});}
 async review(id:string,ownerId:string,dto:ReviewSubscriptionDto){
  const row=await this.subs.findOne({where:{id}});if(!row)throw new NotFoundException('طلب الاشتراك غير موجود');if(row.status!==DoctorSubscriptionStatus.PENDING)throw new ConflictException('تمت مراجعة هذا الطلب مسبقاً');
  if(!row.requiresOwnerApproval)throw new ConflictException('هذا تجديد لطبيب معتمد؛ استخدم إجراء تأكيد استلام دفعة التجديد، ولا يحتاج موافقة أهلية جديدة');
  if(dto.decision==='approved'){
   const now=new Date();const duration=dto.durationDays??row.durationDays;
   const active=await this.subs.findOne({where:{doctorId:row.doctorId,status:DoctorSubscriptionStatus.ACTIVE}});
   const startsAt=active?.expiresAt&&active.expiresAt>now?active.expiresAt:now;
   if(active){active.status=DoctorSubscriptionStatus.EXPIRED;await this.subs.save(active);}
   row.status=DoctorSubscriptionStatus.ACTIVE;row.startsAt=startsAt;row.expiresAt=new Date(startsAt.getTime()+duration*86400000);row.durationDays=duration;
  }else row.status=DoctorSubscriptionStatus.REJECTED;
  row.reviewNote=dto.reviewNote?.trim()??null;row.reviewedBy=ownerId;row.reviewedAt=new Date();const saved=await this.subs.save(row);await this.audit(ownerId,`subscription_${dto.decision}`,'doctor_subscription',row.id,{doctorId:row.doctorId,amountIqd:row.amountIqd,durationDays:row.durationDays,expiresAt:row.expiresAt});return saved;
 }
 async confirmRenewalPayment(id:string,ownerId:string,received:boolean,note?:string){
  const row=await this.subs.findOne({where:{id}});if(!row)throw new NotFoundException('طلب التجديد غير موجود');
  if(row.status!==DoctorSubscriptionStatus.PENDING||row.requiresOwnerApproval)throw new ConflictException('هذا الإجراء مخصص لتجديد اشتراك طبيب سبق اعتماده');
  if(!received){row.status=DoctorSubscriptionStatus.REJECTED;row.reviewNote=note?.trim()||'لم يتم تأكيد استلام دفعة التجديد';row.reviewedBy=ownerId;row.reviewedAt=new Date();const rejected=await this.subs.save(row);await this.audit(ownerId,'subscription_renewal_payment_not_confirmed','doctor_subscription',row.id,{doctorId:row.doctorId,amountIqd:row.amountIqd});return rejected;}
  const now=new Date();const active=await this.subs.findOne({where:{doctorId:row.doctorId,status:DoctorSubscriptionStatus.ACTIVE}});
  const startsAt=active?.expiresAt&&active.expiresAt>now?active.expiresAt:now;
  if(active){active.status=DoctorSubscriptionStatus.EXPIRED;await this.subs.save(active);}
  row.status=DoctorSubscriptionStatus.ACTIVE;row.startsAt=startsAt;row.expiresAt=new Date(startsAt.getTime()+row.durationDays*86400000);row.reviewNote=note?.trim()||'تم تأكيد استلام دفعة التجديد دون الحاجة إلى موافقة أهلية جديدة';row.reviewedBy=ownerId;row.reviewedAt=now;
  const saved=await this.subs.save(row);await this.audit(ownerId,'subscription_renewal_payment_confirmed','doctor_subscription',row.id,{doctorId:row.doctorId,amountIqd:row.amountIqd,durationDays:row.durationDays,startsAt,expiresAt:row.expiresAt});return saved;
 }
 async summary(){
  await this.expireDue();
  const [users,doctors,facilities,pendingSubs,pendingOwnerReview,pendingRenewalPayments,activeSubs,pendingProfiles]=await Promise.all([
   this.users.count({where:{role:UserRole.PATIENT}}),this.users.count({where:{role:UserRole.DOCTOR}}),this.facilities.count(),
   this.subs.count({where:{status:DoctorSubscriptionStatus.PENDING}}),this.subs.count({where:{status:DoctorSubscriptionStatus.PENDING,requiresOwnerApproval:true}}),this.subs.count({where:{status:DoctorSubscriptionStatus.PENDING,requiresOwnerApproval:false}}),this.subs.count({where:{status:DoctorSubscriptionStatus.ACTIVE}}),this.profiles.count({where:{status:'pending' as any}}),
  ]);
  const revenue=await this.subs.createQueryBuilder('s').select('COALESCE(SUM(s."amountIqd"),0)','total').where('s.status IN (:...statuses)',{statuses:[DoctorSubscriptionStatus.ACTIVE,DoctorSubscriptionStatus.EXPIRED]}).getRawOne();
  const expiring=await this.subs.createQueryBuilder('s').where('s.status = :active AND s."expiresAt" <= :date',{active:DoctorSubscriptionStatus.ACTIVE,date:new Date(Date.now()+7*86400000)}).getCount();
  return {patients:users,doctors,facilities,pendingSubscriptions:pendingSubs,pendingOwnerReview,pendingRenewalPayments,activeSubscriptions:activeSubs,pendingProfiles,subscriptionsRevenueIqd:Number(revenue?.total??0),expiringWithin7Days:expiring};
 }
 private async expireDue(){await this.subs.createQueryBuilder().update(DoctorSubscription).set({status:DoctorSubscriptionStatus.EXPIRED}).where('status = :active AND "expiresAt" IS NOT NULL AND "expiresAt" <= :now',{active:DoctorSubscriptionStatus.ACTIVE,now:new Date()}).execute();}
 async listSubscriptions(status?:string){await this.expireDue();if(status&&!Object.values(DoctorSubscriptionStatus).includes(status as DoctorSubscriptionStatus))throw new BadRequestException('حالة الاشتراك غير صحيحة');const rows=await this.subs.find({where:status?{status:status as DoctorSubscriptionStatus}:{},order:{createdAt:'DESC'},take:200});const ids=[...new Set(rows.map(x=>x.doctorId))];const [profiles,users]=await Promise.all([ids.length?this.profiles.find({where:ids.map(userId=>({userId}))}):[],ids.length?this.users.find({where:ids.map(id=>({id}))}):[]]);const pm=new Map(profiles.map(p=>[p.userId,p]));const um=new Map(users.map(u=>[u.id,u]));return rows.map(s=>({...s,doctor:{id:s.doctorId,name:pm.get(s.doctorId)?.fullName??um.get(s.doctorId)?.displayName??'طبيب',phone:um.get(s.doctorId)?.phone??null}}));}
 async listUsers(role?:string){if(role&&!Object.values(UserRole).includes(role as UserRole))throw new BadRequestException('نوع الحساب غير صحيح');const rows=await this.users.find({where:role?{role:role as UserRole}:{},select:{id:true,displayName:true,email:true,phone:true,role:true,isVerified:true,isActive:true,createdAt:true},order:{createdAt:'DESC'},take:200});const doctorIds=rows.filter(u=>u.role===UserRole.DOCTOR).map(u=>u.id);const profiles=doctorIds.length?await this.profiles.find({where:doctorIds.map(userId=>({userId}))}):[];const pm=new Map(profiles.map(p=>[p.userId,p]));return rows.map(u=>({...u,doctorProfile:pm.get(u.id)?{fullName:pm.get(u.id)!.fullName,status:pm.get(u.id)!.status}:null}));}
 async userDetails(id:string){
  await this.expireDue();
  const user=await this.users.findOne({where:{id},select:{id:true,displayName:true,email:true,phone:true,role:true,isVerified:true,isActive:true,createdAt:true,updatedAt:true}});
  if(!user)throw new NotFoundException('الحساب غير موجود');
  if(user.role!==UserRole.DOCTOR)return {...user,doctorProfile:null,subscription:{active:false,expiresAt:null},subscriptionHistory:[]};
  const [profile,history]=await Promise.all([
   this.profiles.findOne({where:{userId:id}}),
   this.subs.find({where:{doctorId:id},order:{createdAt:'DESC'},take:20}),
  ]);
  const active=history.find(x=>x.status===DoctorSubscriptionStatus.ACTIVE&&!!x.expiresAt&&x.expiresAt>new Date());
  return {...user,doctorProfile:profile?{id:profile.id,fullName:profile.fullName,specialty:profile.specialty,subSpecialty:profile.subSpecialty,clinicName:profile.clinicName,address:profile.address,city:profile.city,contactPhone:profile.contactPhone,experienceYears:profile.experienceYears,bio:profile.bio,photoUrl:profile.photoUrl,status:profile.status,reviewNote:profile.reviewNote,reviewedAt:profile.reviewedAt,createdAt:profile.createdAt,updatedAt:profile.updatedAt}:null,
   subscription:{active:!!active,expiresAt:active?.expiresAt??null,startsAt:active?.startsAt??null},
   subscriptionHistory:history.map(x=>({id:x.id,status:x.status,durationDays:x.durationDays,amountIqd:x.amountIqd,createdAt:x.createdAt,startsAt:x.startsAt,expiresAt:x.expiresAt,reviewNote:x.reviewNote,reviewedAt:x.reviewedAt}))};
 }
 async setUserActive(id:string,ownerId:string,isActive:boolean){const user=await this.users.findOne({where:{id}});if(!user)throw new NotFoundException('الحساب غير موجود');if(user.role===UserRole.OWNER)throw new ForbiddenException('لا يمكن تعطيل حساب المالك');user.isActive=isActive;const saved=await this.users.save(user);await this.audit(ownerId,isActive?'user_activated':'user_deactivated','user',id,{role:user.role});return {id:saved.id,isActive:saved.isActive};}
 async auditTrail(ownerId:string){return this.logs.find({where:{ownerId},order:{createdAt:'DESC'},take:200});}
 async currentStatus(doctorId:string){await this.expireDue();const row=await this.subs.findOne({where:{doctorId,status:DoctorSubscriptionStatus.ACTIVE},order:{expiresAt:'DESC'}});if(!row||!row.expiresAt||row.expiresAt<=new Date())return {active:false,expiresAt:row?.expiresAt??null};return {active:true,expiresAt:row.expiresAt,startsAt:row.startsAt};}
}
