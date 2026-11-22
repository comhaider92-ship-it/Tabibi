import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not } from 'typeorm';
import { AvailabilitySlot, SlotStatus } from './availability-slot.entity';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { DoctorProfile, DoctorProfileStatus } from '../doctors/doctor-profile.entity';
import { SlotInputDto } from './dto/create-slots.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { WeeklyScheduleRule, WeeklyScheduleOwnerType } from './weekly-schedule.entity';
import { SaveWeeklyScheduleDto } from './dto/weekly-schedule.dto';
import { ScheduleException } from './schedule-exception.entity';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { validateWeeklyRules, zonedDateTimeParts, minuteOfDay } from './weekly-schedule.utils';
@Injectable()
export class SchedulingService {
 constructor(@InjectRepository(AvailabilitySlot) private slots:Repository<AvailabilitySlot>, @InjectRepository(Appointment) private appointments:Repository<Appointment>, @InjectRepository(DoctorProfile) private doctors:Repository<DoctorProfile>, @InjectRepository(WeeklyScheduleRule) private weeklyRules:Repository<WeeklyScheduleRule>, @InjectRepository(ScheduleException) private exceptions:Repository<ScheduleException>){}
 private async ensureDoctor(userId:string){ const p=await this.doctors.findOne({where:{userId,status:DoctorProfileStatus.APPROVED}}); if(!p) throw new ConflictException('يجب اعتماد ملف الطبيب قبل إضافة المواعيد'); return p; }
 private validate(s:string,e:string){ const a=new Date(s),b=new Date(e); if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||b<=a||a<=new Date()) throw new BadRequestException('تحقق من وقت بداية ونهاية الموعد، ويجب أن يكون الموعد مستقبلياً'); return [a,b] as const; }
 async createMany(userId:string,items:SlotInputDto[]){ await this.ensureDoctor(userId); const parsed=items.map(x=>({...x,range:this.validate(x.startsAt,x.endsAt)}));
  for(const x of parsed) await this.ensureSlotFitsSchedule(userId,x.range[0],x.range[1]);
  const sorted=[...parsed].sort((a,b)=>a.range[0].getTime()-b.range[0].getTime());
  for(let i=1;i<sorted.length;i++) if(sorted[i].range[0]<sorted[i-1].range[1]) throw new ConflictException('توجد مواعيد متداخلة ضمن القائمة');
  for(const x of parsed){ const conflict=await this.slots.createQueryBuilder('s').where('s."doctorId"=:id',{id:userId}).andWhere('s."startsAt" < :end AND s."endsAt" > :start',{start:x.range[0],end:x.range[1]}).getOne(); if(conflict) throw new ConflictException('يتعارض الموعد مع فترة أخرى مسجلة'); }
  return this.slots.save(parsed.map(x=>this.slots.create({doctorId:userId,startsAt:x.range[0],endsAt:x.range[1],status:SlotStatus.OPEN,note:x.note??null})));
 }
 async update(userId:string,id:string,dto:UpdateSlotDto){ const s=await this.slots.findOne({where:{id,doctorId:userId}}); if(!s) throw new NotFoundException('الموعد غير موجود');
  if(dto.startsAt||dto.endsAt){ const [a,b]=this.validate(dto.startsAt??s.startsAt.toISOString(),dto.endsAt??s.endsAt.toISOString()); await this.ensureSlotFitsSchedule(userId,a,b); const conflict=await this.slots.createQueryBuilder('x').where('x."doctorId"=:id',{id:userId}).andWhere('x.id <> :slot',{slot:id}).andWhere('x."startsAt" < :end AND x."endsAt" > :start',{start:a,end:b}).getOne(); if(conflict) throw new ConflictException('يتعارض التعديل مع موعد آخر'); s.startsAt=a;s.endsAt=b; }
  if(dto.status==='open') await this.ensureNoDoctorException(userId,s.startsAt,s.endsAt); if(dto.status) s.status=dto.status as SlotStatus; if(dto.note!==undefined)s.note=dto.note; return this.slots.save(s);
 }
 async updateMany(userId:string,ids:string[],status:'open'|'closed'){ if(!ids.length||ids.length>200) throw new BadRequestException('حدد من 1 إلى 200 موعد'); const found=await this.slots.find({where:ids.map(id=>({id,doctorId:userId}))}); if(found.length!==ids.length) throw new NotFoundException('بعض المواعيد غير موجودة'); if(status==='open') for(const slot of found) await this.ensureNoDoctorException(userId,slot.startsAt,slot.endsAt); found.forEach(s=>s.status=status as SlotStatus); return this.slots.save(found); }
 async mySlots(userId:string,from?:string,to?:string){ await this.ensureDoctor(userId); const qb=this.slots.createQueryBuilder('s').where('s.\"doctorId\"=:id',{id:userId}); if(from)qb.andWhere('s.\"startsAt\">=:from',{from:new Date(from)}); if(to)qb.andWhere('s.\"startsAt\"<:to',{to:new Date(to)}); return qb.orderBy('s.\"startsAt\"','ASC').take(200).getMany(); }
 async publicOpen(doctorId:string,from?:string,to?:string){ const now=new Date(); const qb=this.slots.createQueryBuilder('s').where('s."doctorId"=:doctorId',{doctorId}).andWhere('s.status=:status',{status:SlotStatus.OPEN}).andWhere('s."startsAt">:now',{now}); if(from)qb.andWhere('s."startsAt">=:from',{from:new Date(from)});if(to)qb.andWhere('s."startsAt"<:to',{to:new Date(to)});
  const rows=await qb.orderBy('s."startsAt"','ASC').getMany(); const result=[]; for(const s of rows){ const booked=await this.appointments.createQueryBuilder('a').where('a."doctorId"=:doctorId',{doctorId}).andWhere('a.status=:status',{status:AppointmentStatus.CONFIRMED}).andWhere('a."startsAt" < :end AND a."endsAt" > :start',{start:s.startsAt,end:s.endsAt}).getExists(); if(!booked) result.push(s); } return result;
 }
 async ensureNoDoctorException(userId:string,start:Date,end:Date){const exception=await this.exceptions.createQueryBuilder('e').where('e.ownerType=:type AND e.ownerId=:id AND e.isActive=true',{type:WeeklyScheduleOwnerType.DOCTOR,id:userId}).andWhere('e.startsAt < :end AND e.endsAt > :start',{start,end}).getOne();if(exception)throw new ConflictException(`هذا الوقت معطّل مؤقتاً${exception.reason?`: ${exception.reason}`:''}`);}
 async ensureSlotFitsSchedule(userId:string,start:Date,end:Date){
  await this.ensureNoDoctorException(userId,start,end);
  const rules=await this.weeklyRules.find({where:{ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId,isActive:true}}); if(!rules.length) return; const a=zonedDateTimeParts(start,rules[0].timezone),b=zonedDateTimeParts(end,rules[0].timezone); if(a.year!==b.year||a.month!==b.month||a.day!==b.day) throw new BadRequestException('يجب أن يقع الموعد في يوم دوام واحد'); const rule=rules.find(r=>r.weekday===a.weekday&&a.minuteOfDay>=minuteOfDay(r.startTime)&&b.minuteOfDay<=minuteOfDay(r.endTime)); if(!rule) throw new BadRequestException('الموعد يجب أن يكون ضمن أوقات دوامك الأسبوعية'); for(const br of rule.breaks??[]) if(a.minuteOfDay<minuteOfDay(br.endTime)&&b.minuteOfDay>minuteOfDay(br.startTime)) throw new BadRequestException('الموعد يتعارض مع فترة الاستراحة');
 }
 async createDoctorException(userId:string,dto:CreateScheduleExceptionDto){
  await this.ensureDoctor(userId); const startsAt=new Date(dto.startsAt),endsAt=new Date(dto.endsAt);
  if(!Number.isFinite(startsAt.getTime())||!Number.isFinite(endsAt.getTime())||endsAt<=startsAt||startsAt<=new Date()) throw new BadRequestException('حدد فترة تعطيل مستقبلية صحيحة');
  let timezone=dto.timezone??'Asia/Baghdad'; try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(startsAt);}catch{throw new BadRequestException('المنطقة الزمنية غير صحيحة');}
  const overlap=await this.exceptions.createQueryBuilder('e').where('e.ownerType=:type AND e.ownerId=:id AND e.isActive=true',{type:WeeklyScheduleOwnerType.DOCTOR,id:userId}).andWhere('e.startsAt < :end AND e.endsAt > :start',{start:startsAt,end:endsAt}).getOne(); if(overlap) throw new ConflictException('توجد فترة تعطيل مسجلة تتداخل مع هذه الفترة');
  const openSlots=await this.slots.createQueryBuilder('s').where('s."doctorId"=:id',{id:userId}).andWhere('s.status=:status',{status:SlotStatus.OPEN}).andWhere('s."startsAt" < :end AND s."endsAt" > :start',{start:startsAt,end:endsAt}).getMany();
  const affectedAppointments=await this.appointments.createQueryBuilder('a').where('a."doctorId"=:id',{id:userId}).andWhere('a.status=:status',{status:AppointmentStatus.CONFIRMED}).andWhere('a."startsAt" < :end AND a."endsAt" > :start',{start:startsAt,end:endsAt}).orderBy('a."startsAt"','ASC').getMany();
  const exception=await this.exceptions.save(this.exceptions.create({ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId,serviceId:null,startsAt,endsAt,timezone,reason:dto.reason?.trim()||null,affectedSlotIds:openSlots.map(s=>s.id),isActive:true}));
  if(openSlots.length) await this.slots.createQueryBuilder().update(AvailabilitySlot).set({status:SlotStatus.CLOSED}).whereInIds(openSlots.map(s=>s.id)).andWhere('status=:status',{status:SlotStatus.OPEN}).execute();
  return {exception,closedAvailableSlots:openSlots.length,affectedConfirmedAppointments:affectedAppointments.map(a=>({id:a.id,startsAt:a.startsAt,endsAt:a.endsAt})),warning:affectedAppointments.length?'توجد حجوزات مؤكدة ضمن فترة التعطيل. لم يتم إلغاؤها؛ يجب مراجعة المرضى والتواصل معهم.':null};
 }
 async myDoctorExceptions(userId:string){ await this.ensureDoctor(userId); return this.exceptions.find({where:{ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId,isActive:true},order:{startsAt:'ASC'}}); }
 async removeDoctorException(userId:string,id:string){
  const e=await this.exceptions.findOne({where:{id,ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId,isActive:true}}); if(!e) throw new NotFoundException('فترة التعطيل غير موجودة');
  e.isActive=false; await this.exceptions.save(e);
  const others=await this.exceptions.createQueryBuilder('x').where('x.ownerType=:type AND x.ownerId=:owner AND x.isActive=true',{type:WeeklyScheduleOwnerType.DOCTOR,owner:userId}).andWhere('x.startsAt < :end AND x.endsAt > :start',{start:e.startsAt,end:e.endsAt}).getMany();
  if(e.affectedSlotIds.length){ const slots=await this.slots.findByIds(e.affectedSlotIds); for(const slot of slots){ if(slot.status!==SlotStatus.CLOSED) continue; const blocked=others.some(x=>x.startsAt<slot.endsAt&&x.endsAt>slot.startsAt); if(!blocked&&slot.startsAt>new Date()){try{await this.ensureSlotFitsSchedule(userId,slot.startsAt,slot.endsAt);slot.status=SlotStatus.OPEN;}catch{/* Keep it closed if a newer weekly rule or closure now blocks it. */}} } await this.slots.save(slots); }
  return {restored:true,exception:e};
 }
 async saveWeeklySchedule(userId:string,dto:SaveWeeklyScheduleDto){ await this.ensureDoctor(userId); validateWeeklyRules(dto.rules); const timezone=dto.rules[0].timezone??'Asia/Baghdad'; if(dto.rules.some(r=>(r.timezone??'Asia/Baghdad')!==timezone)) throw new BadRequestException('استخدم منطقة زمنية واحدة لجدول الدوام'); await this.weeklyRules.delete({ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId}); return this.weeklyRules.save(dto.rules.map(r=>this.weeklyRules.create({ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId,serviceId:null,weekday:r.weekday,startTime:r.startTime,endTime:r.endTime,breaks:r.breaks??[],timezone,isActive:true}))); }
 async myWeeklySchedule(userId:string){ await this.ensureDoctor(userId); return this.weeklyRules.find({where:{ownerType:WeeklyScheduleOwnerType.DOCTOR,ownerId:userId,isActive:true},order:{weekday:'ASC',startTime:'ASC'}}); }
 async closeSlotIfBooked(doctorId:string,startsAt:Date,endsAt:Date){ const s=await this.slots.findOne({where:{doctorId,startsAt,endsAt,status:SlotStatus.OPEN}}); if(s){s.status=SlotStatus.CLOSED;await this.slots.save(s);} }
}
