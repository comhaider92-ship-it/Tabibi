import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, MoreThanOrEqual, QueryFailedError, Repository } from 'typeorm';
import { MedicalFacility, FacilityStatus } from './facility.entity';
import { FacilityService } from './facility-service.entity';
import { FacilityBooking, FacilityBookingStatus } from './facility-booking.entity';
import { FacilityAvailabilitySlot, FacilitySlotStatus } from './facility-slot.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { CreateFacilityServiceDto } from './dto/create-facility-service.dto';
import { UpdateFacilityServiceDto } from './dto/update-facility-service.dto';
import { UpdateFacilityProfileDto } from './dto/update-facility-profile.dto';
import { CreateFacilityBookingDto } from './dto/create-facility-booking.dto';
import { FacilityDirectoryQueryDto } from './dto/facility-directory-query.dto';
import { CreateFacilitySlotDto } from './dto/create-facility-slot.dto';
import { FacilitySlotsQueryDto } from './dto/facility-slots-query.dto';
import { UpdateFacilityBookingStatusDto } from './dto/update-facility-booking-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { OwnerAuditLog } from '../subscriptions/audit-log.entity';
import { NotificationType } from '../notifications/notification.entity';
import { WeeklyScheduleRule, WeeklyScheduleOwnerType } from '../scheduling/weekly-schedule.entity';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { CreateScheduleExceptionDto } from '../scheduling/dto/create-schedule-exception.dto';
import { SaveWeeklyScheduleDto, GenerateFacilitySlotsDto } from '../scheduling/dto/weekly-schedule.dto';
import { dateWeekday, minuteOfDay, validateWeeklyRules, zonedLocalToUtc, zonedDateTimeParts } from '../scheduling/weekly-schedule.utils';

function baghdadDayStart(value: Date): Date {
 const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
 const get=(type:string)=>Number(parts.find(part=>part.type===type)?.value);
 return new Date(Date.UTC(get('year'),get('month')-1,get('day'))-3*60*60*1000);
}

@Injectable()
export class FacilitiesService {
 constructor(
  @InjectRepository(MedicalFacility) private readonly facilities:Repository<MedicalFacility>,
  @InjectRepository(FacilityService) private readonly services:Repository<FacilityService>,
  @InjectRepository(FacilityBooking) private readonly bookings:Repository<FacilityBooking>,
  @InjectRepository(FacilityAvailabilitySlot) private readonly slots:Repository<FacilityAvailabilitySlot>,
  private readonly dataSource:DataSource,
  private readonly notifications:NotificationsService,
  @InjectRepository(WeeklyScheduleRule) private readonly weeklyRules:Repository<WeeklyScheduleRule>,
  @InjectRepository(ScheduleException) private readonly exceptions:Repository<ScheduleException>,
  @InjectRepository(OwnerAuditLog) private readonly auditLogs:Repository<OwnerAuditLog>,
 ) {}
 async pendingFacilities() { return this.facilities.find({where:{status:FacilityStatus.PENDING},order:{createdAt:'ASC'}}); }
 async myFacilities(ownerId:string) {
  return this.facilities.find({where:{ownerUserId:ownerId},order:{createdAt:'DESC'}});
 }
 async directory(filters:FacilityDirectoryQueryDto) {
  const qb=this.facilities.createQueryBuilder('f').select(['f.id','f.name','f.facilityType','f.city','f.address','f.phone','f.description','f.imageUrl','f.createdAt','f.updatedAt'])
   .leftJoin(FacilityService,'s','s.facilityId = f.id AND s.isActive = true').where('f.status = :status',{status:FacilityStatus.APPROVED});
  const city=filters.city?.trim(),type=filters.type?.trim(),name=filters.name?.trim(),serviceName=filters.serviceName?.trim(),q=filters.q?.trim();
  if(city) qb.andWhere('LOWER(f.city)=LOWER(:city)',{city}); if(type) qb.andWhere('f.facilityType=:type',{type});
  if(name) qb.andWhere('f.name ILIKE :facilityName',{facilityName:`%${name}%`});
  if(serviceName) qb.andWhere('s.name ILIKE :serviceName',{serviceName:`%${serviceName}%`});
  if(q) qb.andWhere(new Brackets(search=>search.where('f.name ILIKE :directorySearch',{directorySearch:`%${q}%`}).orWhere('s.name ILIKE :directorySearch')));
  return qb.distinct(true).orderBy('f.name','ASC').getMany();
 }
 async ownerServices(ownerId:string,facilityId:string){const facility=await this.ownedFacility(ownerId,facilityId);return this.services.find({where:{facilityId:facility.id},order:{name:'ASC'}});}
 async ownerWeeklySchedule(ownerId:string,facilityId:string,serviceId:string){const facility=await this.ownedFacility(ownerId,facilityId);const service=await this.services.findOne({where:{id:serviceId,facilityId:facility.id,isActive:true}});if(!service)throw new NotFoundException('الخدمة غير موجودة أو متوقفة');return this.weeklyRules.find({where:{ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facility.id,serviceId,isActive:true},order:{weekday:'ASC',startTime:'ASC'}});}
 async servicesFor(facilityId:string) {
  const facility=await this.facilities.findOne({where:{id:facilityId,status:FacilityStatus.APPROVED}});
  if(!facility) throw new NotFoundException('المركز غير متاح');
  return this.services.find({where:{facilityId,isActive:true},order:{name:'ASC'}});
 }
 async createFacility(ownerId:string,dto:CreateFacilityDto) {
  const saved=await this.facilities.save(this.facilities.create({...dto,ownerUserId:ownerId,status:FacilityStatus.PENDING,phone:dto.phone??null,description:dto.description??null}));
  return saved;
 }
 async updateFacilityProfile(ownerId:string,facilityId:string,dto:UpdateFacilityProfileDto) {
  const facility=await this.ownedFacility(ownerId,facilityId);
  const before={name:facility.name,facilityType:facility.facilityType,city:facility.city,address:facility.address,phone:facility.phone,description:facility.description};
  Object.assign(facility,{...dto,name:dto.name?.trim()??facility.name,city:dto.city?.trim()??facility.city,address:dto.address?.trim()??facility.address,phone:dto.phone===undefined?facility.phone:(dto.phone?.trim()||null),description:dto.description===undefined?facility.description:(dto.description?.trim()||null)});
  const saved=await this.facilities.save(facility);
  await this.auditLogs.save(this.auditLogs.create({ownerId,action:'facility_profile_updated',targetType:'medical_facility',targetId:facility.id,details:{before,after:{name:saved.name,facilityType:saved.facilityType,city:saved.city,address:saved.address,phone:saved.phone,description:saved.description}}}));
  return saved;
 }
 async addService(ownerId:string,facilityId:string,dto:CreateFacilityServiceDto) {
  const facility=await this.ownedFacility(ownerId,facilityId);
  return this.services.save(this.services.create({facilityId:facility.id,...dto,priceIqd:dto.priceIqd??null,expectedDurationMinutes:dto.expectedDurationMinutes??30,isActive:true}));
 }
 async updateService(ownerId:string,facilityId:string,serviceId:string,dto:UpdateFacilityServiceDto) {
  const facility=await this.ownedFacility(ownerId,facilityId);
  const service=await this.services.findOne({where:{id:serviceId,facilityId:facility.id}});
  if(!service) throw new NotFoundException('الخدمة غير موجودة');
  if(dto.isActive===false) {
   const pending=await this.bookings.createQueryBuilder('b').where('b.\"serviceId\"=:serviceId',{serviceId}).andWhere('b.status IN (:...statuses)',{statuses:[FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED]}).andWhere('b.startsAt > :now',{now:new Date()}).getCount();
   if(pending>0) throw new ConflictException('لا يمكن إيقاف الخدمة لوجود حجوزات قائمة؛ عالج الحجوزات أولاً');
  }
  Object.assign(service,dto);
  return this.services.save(service);
 }
 async reviewFacility(id:string,status:FacilityStatus,ownerId:string) {
  const facility=await this.facilities.findOne({where:{id}}); if(!facility) throw new NotFoundException('المركز غير موجود');
  facility.status=status; const saved=await this.facilities.save(facility);
  await this.auditLogs.save(this.auditLogs.create({ownerId,action:`facility_${status}`,targetType:'medical_facility',targetId:id,details:{facilityName:facility.name}}));
  return saved;
 }
 async createSlot(ownerId:string,facilityId:string,dto:CreateFacilitySlotDto) {
  const facility=await this.ownedFacility(ownerId,facilityId);
  const service=await this.services.findOne({where:{id:dto.serviceId,facilityId:facility.id,isActive:true}});
  if(!service) throw new NotFoundException('الخدمة غير موجودة أو متوقفة');
  const startsAt=new Date(dto.startsAt),endsAt=new Date(dto.endsAt),duration=(endsAt.getTime()-startsAt.getTime())/60000;
  if(!Number.isFinite(startsAt.getTime())||!Number.isFinite(endsAt.getTime())||startsAt<=new Date()||duration<=0||duration>480)
   throw new BadRequestException('وقت الموعد غير صحيح');
  if(Math.abs(duration-service.expectedDurationMinutes)>0.01)
   throw new BadRequestException(`مدة الموعد يجب أن تكون ${service.expectedDurationMinutes} دقيقة`);
  await this.ensureFacilitySlotFitsSchedule(facility.id,service.id,startsAt,endsAt);
  try { return await this.slots.save(this.slots.create({facilityId:facility.id,serviceId:service.id,startsAt,endsAt,status:FacilitySlotStatus.AVAILABLE})); }
  catch(error) { if(error instanceof QueryFailedError&&(error as any).driverError?.code==='23505') throw new ConflictException('هذا الموعد مضاف مسبقاً'); throw error; }
 }
 async ownerSlots(ownerId:string,facilityId:string,serviceId?:string,from?:string,to?:string){
  const facility=await this.ownedFacility(ownerId,facilityId); const qb=this.slots.createQueryBuilder('s').where('s."facilityId"=:id',{id:facility.id});
  if(serviceId)qb.andWhere('s."serviceId"=:serviceId',{serviceId}); if(from)qb.andWhere('s."startsAt">=:from',{from:new Date(from)}); if(to)qb.andWhere('s."startsAt"<:to',{to:new Date(to)});
  return qb.orderBy('s."startsAt"','ASC').take(300).getMany();
 }
 async updateOwnerSlotStatus(ownerId:string,facilityId:string,slotId:string,status:'available'|'closed'){
  const facility=await this.ownedFacility(ownerId,facilityId); const slot=await this.slots.findOne({where:{id:slotId,facilityId:facility.id}}); if(!slot)throw new NotFoundException('الموعد غير موجود');
  const activeBooking=await this.bookings.findOne({where:{slotId,status:In([FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED])}});
  if(activeBooking)throw new ConflictException('لا يمكن تغيير حالة موعد مرتبط بحجز قائم');
  if(status==='available')await this.ensureFacilitySlotFitsSchedule(facility.id,slot.serviceId,slot.startsAt,slot.endsAt);
  slot.status=status==='available'?FacilitySlotStatus.AVAILABLE:FacilitySlotStatus.CLOSED; return this.slots.save(slot);
 }
 async ensureFacilitySlotFitsSchedule(facilityId:string,serviceId:string,start:Date,end:Date){ const exception=await this.exceptions.createQueryBuilder('e').where('e.ownerType=:type AND e.ownerId=:id AND e.isActive=true',{type:WeeklyScheduleOwnerType.FACILITY,id:facilityId}).andWhere('(e.serviceId IS NULL OR e.serviceId=:serviceId)',{serviceId}).andWhere('e.startsAt < :end AND e.endsAt > :start',{start,end}).getOne(); if(exception) throw new ConflictException(`هذه الفترة معطّلة مؤقتاً${exception.reason?`: ${exception.reason}`:''}`); const rules=await this.weeklyRules.find({where:{ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facilityId,serviceId,isActive:true}}); if(!rules.length) return; const a=zonedDateTimeParts(start,rules[0].timezone),b=zonedDateTimeParts(end,rules[0].timezone); if(a.year!==b.year||a.month!==b.month||a.day!==b.day) throw new BadRequestException('يجب أن يقع الموعد ضمن يوم دوام واحد'); const rule=rules.find(r=>r.weekday===a.weekday&&a.minuteOfDay>=minuteOfDay(r.startTime)&&b.minuteOfDay<=minuteOfDay(r.endTime)); if(!rule) throw new BadRequestException('الموعد يجب أن يكون ضمن جدول دوام الخدمة'); if((rule.breaks??[]).some(br=>a.minuteOfDay<minuteOfDay(br.endTime)&&b.minuteOfDay>minuteOfDay(br.startTime))) throw new BadRequestException('الموعد يتعارض مع استراحة المركز'); }
 async saveWeeklySchedule(ownerId:string,facilityId:string,serviceId:string,dto:SaveWeeklyScheduleDto){
  const facility=await this.ownedFacility(ownerId,facilityId);
  const service=await this.services.findOne({where:{id:serviceId,facilityId:facility.id,isActive:true}});
  if(!service) throw new NotFoundException('الخدمة غير موجودة أو متوقفة');
  validateWeeklyRules(dto.rules); const timezone=dto.rules[0].timezone??'Asia/Baghdad';
  if(dto.rules.some(r=>(r.timezone??'Asia/Baghdad')!==timezone)) throw new BadRequestException('استخدم منطقة زمنية واحدة لجدول الخدمة');
  await this.weeklyRules.delete({ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facility.id,serviceId});
  return this.weeklyRules.save(dto.rules.map(r=>this.weeklyRules.create({ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facility.id,serviceId,weekday:r.weekday,startTime:r.startTime,endTime:r.endTime,breaks:r.breaks??[],timezone,isActive:true})));
 }
 async publicWeeklySchedule(facilityId:string,serviceId?:string){
  const facility=await this.facilities.findOne({where:{id:facilityId,status:FacilityStatus.APPROVED}}); if(!facility) throw new NotFoundException('المركز غير متاح');
  return this.weeklyRules.find({where:{ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facilityId,isActive:true,...(serviceId?{serviceId}:{})},order:{weekday:'ASC',startTime:'ASC'}});
 }
 async generateFacilitySlots(ownerId:string,facilityId:string,serviceId:string,dto:GenerateFacilitySlotsDto){
  const facility=await this.ownedFacility(ownerId,facilityId);
  const service=await this.services.findOne({where:{id:serviceId,facilityId:facility.id,isActive:true}}); if(!service) throw new NotFoundException('الخدمة غير موجودة أو متوقفة');
  const from=new Date(`${dto.from}T00:00:00Z`),to=new Date(`${dto.to}T00:00:00Z`);
  if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from.toISOString().slice(0,10)!==dto.from||to.toISOString().slice(0,10)!==dto.to||to<from||(to.getTime()-from.getTime())/86400000>30) throw new BadRequestException('اختر فترة لا تتجاوز 31 يوماً');
  const rules=await this.weeklyRules.find({where:{ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facility.id,serviceId,isActive:true}}); if(!rules.length) throw new BadRequestException('أضف جدول الدوام الأسبوعي لهذه الخدمة أولاً');
  const existing=await this.slots.find({where:{facilityId:facility.id,serviceId,startsAt:MoreThanOrEqual(new Date(dto.from+'T00:00:00Z'))}});
  const keys=new Set(existing.map(x=>x.startsAt.toISOString())); const toCreate=[]; const duration=service.expectedDurationMinutes; const activeExceptions=await this.exceptions.find({where:{ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facility.id,isActive:true}});
  for(let day=new Date(from);day<=to;day.setUTCDate(day.getUTCDate()+1)){
   const date=day.toISOString().slice(0,10),weekday=dateWeekday(date);
   for(const rule of rules.filter(r=>r.weekday===weekday)){
    const start=minuteOfDay(rule.startTime),end=minuteOfDay(rule.endTime);
    for(let m=start;m+duration<=end;m+=duration){
     const hh=String(Math.floor(m/60)).padStart(2,'0'),mm=String(m%60).padStart(2,'0'); const eh=String(Math.floor((m+duration)/60)).padStart(2,'0'),em=String((m+duration)%60).padStart(2,'0');
     const blocked=(rule.breaks??[]).some(b=>m<minuteOfDay(b.endTime)&&m+duration>minuteOfDay(b.startTime)); if(blocked) continue;
     const startsAt=zonedLocalToUtc(date,`${hh}:${mm}`,rule.timezone),endsAt=zonedLocalToUtc(date,`${eh}:${em}`,rule.timezone);
     if(startsAt<=new Date()||keys.has(startsAt.toISOString())) continue;
     if(activeExceptions.some(e=>(!e.serviceId||e.serviceId===serviceId)&&e.startsAt<endsAt&&e.endsAt>startsAt)) continue;
     keys.add(startsAt.toISOString()); toCreate.push(this.slots.create({facilityId:facility.id,serviceId,startsAt,endsAt,status:FacilitySlotStatus.AVAILABLE}));
    }
   }
  }
  if(toCreate.length) await this.slots.save(toCreate);
  return {created:toCreate.length,serviceId,from:dto.from,to:dto.to,slots:toCreate};
 }
 async createScheduleException(ownerId:string,facilityId:string,dto:CreateScheduleExceptionDto){
  const facility=await this.ownedFacility(ownerId,facilityId); const startsAt=new Date(dto.startsAt),endsAt=new Date(dto.endsAt);
  if(!Number.isFinite(startsAt.getTime())||!Number.isFinite(endsAt.getTime())||endsAt<=startsAt||startsAt<=new Date()) throw new BadRequestException('حدد فترة تعطيل مستقبلية صحيحة');
  let timezone=dto.timezone??'Asia/Baghdad'; try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(startsAt);}catch{throw new BadRequestException('المنطقة الزمنية غير صحيحة');}
  if(dto.serviceId){const service=await this.services.findOne({where:{id:dto.serviceId,facilityId:facility.id}});if(!service)throw new NotFoundException('الخدمة غير موجودة ضمن هذا المركز');}
  const overlapQ=this.exceptions.createQueryBuilder('e').where('e.ownerType=:type AND e.ownerId=:id AND e.isActive=true',{type:WeeklyScheduleOwnerType.FACILITY,id:facility.id}).andWhere('e.startsAt < :end AND e.endsAt > :start',{start:startsAt,end:endsAt});
  if(dto.serviceId) overlapQ.andWhere('(e.serviceId IS NULL OR e.serviceId=:serviceId)',{serviceId:dto.serviceId});
  else overlapQ.andWhere('e.serviceId IS NULL');
  if(await overlapQ.getOne()) throw new ConflictException('توجد فترة تعطيل مسجلة تتداخل مع هذه الفترة');
  const slotQ=this.slots.createQueryBuilder('s').where('s.facilityId=:id',{id:facility.id}).andWhere('s.status=:status',{status:FacilitySlotStatus.AVAILABLE}).andWhere('s.startsAt < :end AND s.endsAt > :start',{start:startsAt,end:endsAt});
  if(dto.serviceId) slotQ.andWhere('s.serviceId=:serviceId',{serviceId:dto.serviceId});
  const openSlots=await slotQ.getMany();
  const bookingQ=this.bookings.createQueryBuilder('b').leftJoin(FacilityAvailabilitySlot,'slot','slot.id = b."slotId"').where('b.facilityId=:id',{id:facility.id}).andWhere('b.status IN (:...statuses)',{statuses:[FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED]}).andWhere('b.startsAt < :end AND COALESCE(slot."endsAt", b."startsAt") > :start',{start:startsAt,end:endsAt});
  if(dto.serviceId) bookingQ.andWhere('b.serviceId=:serviceId',{serviceId:dto.serviceId});
  const affectedBookings=await bookingQ.orderBy('b.startsAt','ASC').getMany();
  const exception=await this.exceptions.save(this.exceptions.create({ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facility.id,serviceId:dto.serviceId??null,startsAt,endsAt,timezone,reason:dto.reason?.trim()||null,affectedSlotIds:openSlots.map(s=>s.id),isActive:true}));
  if(openSlots.length) await this.slots.createQueryBuilder().update(FacilityAvailabilitySlot).set({status:FacilitySlotStatus.CLOSED}).whereInIds(openSlots.map(s=>s.id)).execute();
  return {exception,closedAvailableSlots:openSlots.length,affectedBookings:affectedBookings.map(b=>({id:b.id,patientName:b.patientName,startsAt:b.startsAt,status:b.status})),warning:affectedBookings.length?'توجد حجوزات قائمة ضمن فترة التعطيل. لم يتم إلغاؤها؛ يجب مراجعتها والتواصل مع المرضى.':null};
 }
 async ownerScheduleExceptions(ownerId:string,facilityId:string){await this.ownedFacility(ownerId,facilityId);return this.exceptions.find({where:{ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facilityId,isActive:true},order:{startsAt:'ASC'}});}
 async restoreScheduleException(ownerId:string,facilityId:string,exceptionId:string){
  await this.ownedFacility(ownerId,facilityId); const e=await this.exceptions.findOne({where:{id:exceptionId,ownerType:WeeklyScheduleOwnerType.FACILITY,ownerId:facilityId,isActive:true}}); if(!e)throw new NotFoundException('فترة التعطيل غير موجودة');
  e.isActive=false; await this.exceptions.save(e);
  const others=await this.exceptions.createQueryBuilder('x').where('x.ownerType=:type AND x.ownerId=:owner AND x.isActive=true',{type:WeeklyScheduleOwnerType.FACILITY,owner:facilityId}).andWhere('x.startsAt < :end AND x.endsAt > :start',{start:e.startsAt,end:e.endsAt}).getMany();
  if(e.affectedSlotIds.length){const slots=await this.slots.findByIds(e.affectedSlotIds);for(const slot of slots){if(slot.status!==FacilitySlotStatus.CLOSED)continue;const blocked=others.some(x=>(!x.serviceId||x.serviceId===slot.serviceId)&&x.startsAt<slot.endsAt&&x.endsAt>slot.startsAt);if(!blocked&&slot.startsAt>new Date()){try{await this.ensureFacilitySlotFitsSchedule(facilityId,slot.serviceId,slot.startsAt,slot.endsAt);slot.status=FacilitySlotStatus.AVAILABLE;}catch{/* Keep it closed if a newer weekly rule or closure now blocks it. */}}}await this.slots.save(slots);}
  return {restored:true,exception:e};
 }
 async publicSlots(facilityId:string,filters:FacilitySlotsQueryDto) {
  const from=new Date(filters.from),to=new Date(filters.to);
  if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||to<=from||to.getTime()-from.getTime()>31*86400000) throw new BadRequestException('الفترة الزمنية يجب ألا تتجاوز 31 يوماً');
  const facility=await this.facilities.findOne({where:{id:facilityId,status:FacilityStatus.APPROVED}});
  if(!facility) throw new NotFoundException('المركز غير متاح');
  const qb=this.slots.createQueryBuilder('slot').where('slot.facilityId=:facilityId',{facilityId}).andWhere('slot.status=:status',{status:FacilitySlotStatus.AVAILABLE})
   .andWhere('slot.startsAt >= :from AND slot.startsAt < :to',{from,to}).andWhere('slot.startsAt > :now',{now:new Date()});
  if(filters.serviceId) qb.andWhere('slot.serviceId=:serviceId',{serviceId:filters.serviceId});
  return qb.orderBy('slot.startsAt','ASC').getMany();
 }
 async createBooking(userId:string,key:string,dto:CreateFacilityBookingDto) {
  if(!key||key.length>100) throw new BadRequestException('مفتاح الحجز مطلوب');
  const replay=await this.bookings.findOne({where:{idempotencyKey:key}});
  if(replay) {
   const sameRequest = replay.bookedByUserId===userId
    && replay.facilityId===dto.facilityId
    && replay.serviceId===dto.serviceId
    && replay.slotId===dto.slotId
    && replay.patientName===dto.patientName
    && replay.patientPhone===(dto.patientPhone??null)
    && replay.patientNote===(dto.patientNote??null);
   if(!sameRequest) throw new ConflictException('مفتاح الحجز مستخدم لطلب مختلف؛ أعد المحاولة بمفتاح جديد');
   return replay;
  }
  const result = await this.dataSource.transaction(async manager=>{
   const slot=await manager.getRepository(FacilityAvailabilitySlot).createQueryBuilder('slot').setLock('pessimistic_write').where('slot.id=:id',{id:dto.slotId}).getOne();
   if(!slot||slot.facilityId!==dto.facilityId||slot.serviceId!==dto.serviceId||slot.status!==FacilitySlotStatus.AVAILABLE||slot.startsAt<=new Date()) throw new ConflictException('هذا الموعد لم يعد متاحاً، اختر موعداً آخر');
   const facility=await manager.getRepository(MedicalFacility).findOne({where:{id:slot.facilityId,status:FacilityStatus.APPROVED}});
   if(!facility) throw new ConflictException('المركز غير متاح للحجز حالياً');
   const service=await manager.getRepository(FacilityService).findOne({where:{id:slot.serviceId,facilityId:facility.id,isActive:true}});
   if(!service) throw new ConflictException('الخدمة غير متاحة حالياً');
   const booking=manager.getRepository(FacilityBooking).create({facilityId:facility.id,serviceId:service.id,slotId:slot.id,bookedByUserId:userId,patientName:dto.patientName,patientPhone:dto.patientPhone??null,startsAt:slot.startsAt,status:FacilityBookingStatus.REQUESTED,idempotencyKey:key,patientNote:dto.patientNote??null});
   slot.status=FacilitySlotStatus.BOOKED;
   await manager.getRepository(FacilityAvailabilitySlot).save(slot);
   const savedBooking = await manager.getRepository(FacilityBooking).save(booking);
   return { booking: savedBooking, facility, service };
  });
  await this.notifications.createAndDispatch({
   userId: result.facility.ownerUserId, type: NotificationType.FACILITY_BOOKING_REQUESTED,
   title: 'طلب حجز جديد', body: `لديك طلب حجز جديد باسم ${result.booking.patientName} لخدمة ${result.service.name}.`,
   data: { event: 'facility_booking_requested', bookingId: result.booking.id, facilityBookingId: result.booking.id, facilityId: result.facility.id, serviceId: result.service.id, startsAt: result.booking.startsAt.toISOString() },
  });
  return result.booking;
 }
 async ownerBookings(ownerId:string,facilityId:string,status?:string) {
  await this.ownedFacility(ownerId,facilityId);
  const qb=this.bookings.createQueryBuilder('b').where('b.facilityId=:facilityId',{facilityId}).orderBy('b.startsAt','ASC');
  if(status) qb.andWhere('b.status=:status',{status});
  return qb.getMany();
 }
 async updateBookingStatus(ownerId:string,bookingId:string,dto:UpdateFacilityBookingStatusDto) {
  const result = await this.dataSource.transaction(async manager=>{
   const booking=await manager.getRepository(FacilityBooking).createQueryBuilder('b').setLock('pessimistic_write').where('b.id=:id',{id:bookingId}).getOne();
   if(!booking) throw new NotFoundException('طلب الحجز غير موجود');
   const facility = await this.ownedFacility(ownerId,booking.facilityId);
   if(booking.status!==FacilityBookingStatus.REQUESTED) throw new ConflictException('لا يمكن تعديل هذا الطلب بعد اتخاذ قرار بشأنه');
   const rejectionReason=dto.reason?.trim();
   if(dto.status==='rejected'&&!rejectionReason) throw new BadRequestException('يرجى كتابة سبب رفض طلب الحجز ليظهر للمراجع');
   if(dto.status==='confirmed') booking.status=FacilityBookingStatus.CONFIRMED;
   else if(dto.status==='rejected') { booking.status=FacilityBookingStatus.REJECTED; await this.releaseFacilitySlotIfUnused(manager,booking); }
   else throw new BadRequestException('الحالة المطلوبة غير صالحة لهذا الطلب');
   booking.statusNote=dto.reason?.trim() || null;
   const saved = await manager.getRepository(FacilityBooking).save(booking);
   const service = await manager.getRepository(FacilityService).findOne({ where: { id: booking.serviceId } });
   return { booking: saved, facility, serviceName: service?.name ?? 'الخدمة المطلوبة' };
  });
  const confirmed = result.booking.status === FacilityBookingStatus.CONFIRMED;
  const title = confirmed ? 'تم تأكيد حجزك' : 'تعذر قبول الحجز';
  const body = confirmed
   ? `تم تأكيد حجزك لدى ${result.facility.name} لخدمة ${result.serviceName}.`
   : `تم رفض طلب حجزك لدى ${result.facility.name}.${result.booking.statusNote ? ` السبب: ${result.booking.statusNote}` : ''}`;
  await this.notifications.createAndDispatch({
   userId: result.booking.bookedByUserId,
   type: confirmed ? NotificationType.FACILITY_BOOKING_CONFIRMED : NotificationType.FACILITY_BOOKING_REJECTED,
   title, body,
   data: { event: confirmed ? 'facility_booking_confirmed' : 'facility_booking_rejected', bookingId: result.booking.id, facilityBookingId: result.booking.id, facilityId: result.facility.id, status: result.booking.status, startsAt: result.booking.startsAt.toISOString(), reason: result.booking.statusNote ?? '' },
  });
  return result.booking;
 }
 async cancelPatientBooking(userId:string,bookingId:string) {
  const result = await this.dataSource.transaction(async manager=>{
   const booking=await manager.getRepository(FacilityBooking).createQueryBuilder('b').setLock('pessimistic_write').where('b.id=:id',{id:bookingId}).getOne();
   if(!booking) throw new NotFoundException('الحجز غير موجود');
   if(booking.bookedByUserId!==userId) throw new ForbiddenException();
   if(![FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED].includes(booking.status)||baghdadDayStart(booking.startsAt)<=new Date()) throw new ConflictException('لا يمكن إلغاء الحجز بعد بداية يوم المراجعة');
   booking.status=FacilityBookingStatus.CANCELLED;
   await this.releaseFacilitySlotIfUnused(manager,booking);
   const facility = await manager.getRepository(MedicalFacility).findOne({ where: { id: booking.facilityId } });
   return { booking: await manager.getRepository(FacilityBooking).save(booking), facility };
  });
  if (result.facility) await this.notifications.createAndDispatch({
   userId: result.facility.ownerUserId, type: NotificationType.FACILITY_BOOKING_CANCELLED,
   title: 'تم إلغاء حجز', body: `قام المريض ${result.booking.patientName} بإلغاء حجزه لدى ${result.facility.name}.`,
   data: { event: 'facility_booking_cancelled', bookingId: result.booking.id, facilityBookingId: result.booking.id, facilityId: result.facility.id, startsAt: result.booking.startsAt.toISOString() },
  });
  return result.booking;
 }
 async myBookings(userId:string) {
  const rows=await this.bookings.find({where:{bookedByUserId:userId},order:{startsAt:'DESC'}});
  if(!rows.length) return [];
  const facilityIds=[...new Set(rows.map(x=>x.facilityId))];
  const serviceIds=[...new Set(rows.map(x=>x.serviceId))];
  const [facilities,services]=await Promise.all([
   this.facilities.find({where:facilityIds.map(id=>({id}))}),
   this.services.find({where:serviceIds.map(id=>({id}))}),
  ]);
  const facilityById=new Map(facilities.map(x=>[x.id,x]));
  const serviceById=new Map(services.map(x=>[x.id,x]));
  return rows.map(booking=>{
   const facility=facilityById.get(booking.facilityId);
   const service=serviceById.get(booking.serviceId);
   return {...booking,facility:facility?{id:facility.id,name:facility.name,city:facility.city,address:facility.address}:null,service:service?{id:service.id,name:service.name}:null,canMessage:true,canCancel:[FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED].includes(booking.status)&&baghdadDayStart(booking.startsAt)>new Date()};
  });
 }

 private async releaseFacilitySlotIfUnused(manager:any,booking:FacilityBooking) {
  if(!booking.slotId) return;
  const slotRepo=manager.getRepository(FacilityAvailabilitySlot);
  const slot=await slotRepo.createQueryBuilder('slot').setLock('pessimistic_write').where('slot.id=:id',{id:booking.slotId}).getOne();
  if(!slot) return;
  const active=await manager.getRepository(FacilityBooking).createQueryBuilder('b')
   .where('b.slotId=:slotId AND b.id<>:bookingId',{slotId:slot.id,bookingId:booking.id})
   .andWhere('b.status IN (:...statuses)',{statuses:[FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED]}).getCount();
  if(active>0) return;
  const closure=await manager.getRepository(ScheduleException).createQueryBuilder('e')
   .where('e.ownerType=:type AND e.ownerId=:facilityId AND e.isActive=true',{type:WeeklyScheduleOwnerType.FACILITY,facilityId:booking.facilityId})
   .andWhere('(e.serviceId IS NULL OR e.serviceId=:serviceId)',{serviceId:booking.serviceId})
   .andWhere('e.startsAt < :end AND e.endsAt > :start',{start:slot.startsAt,end:slot.endsAt}).getOne();
  slot.status=closure?FacilitySlotStatus.CLOSED:FacilitySlotStatus.AVAILABLE;
  await slotRepo.save(slot);
 }
 private async ownedFacility(ownerId:string,facilityId:string) {
  const facility=await this.facilities.findOne({where:{id:facilityId}});
  if(!facility) throw new NotFoundException('المركز غير موجود');
  if(facility.ownerUserId!==ownerId) throw new ForbiddenException('لا تملك صلاحية إدارة هذا المركز');
  return facility;
 }
}
