import { BadRequestException, ConflictException, Injectable, TooManyRequestsException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthOtp, OtpPurpose } from './otp.entity';
import { UsersService } from '../users/users.service';
import { OtpDeliveryService } from './otp-delivery.service';

@Injectable()
export class OtpService {
 private readonly ttl=5*60*1000;
 private readonly resend=60*1000;
 private readonly maxAttempts=5;
 private normalizeTarget(value:string):string { const trimmed=String(value||'').trim(); return trimmed.includes('@')?trimmed.toLowerCase():trimmed; }
 constructor(@InjectRepository(AuthOtp) private readonly repo:Repository<AuthOtp>,
  private readonly users:UsersService,private readonly delivery:OtpDeliveryService){}


 async requestContactChange(userId:string,contactType:'phone'|'email',rawValue:string){
  const value=contactType==='email'?rawValue.trim().toLowerCase():rawValue.trim();
  if(contactType==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new BadRequestException('البريد الإلكتروني غير صالح.');
  if(contactType==='phone'&&!/^\+?[0-9]{7,15}$/.test(value)) throw new BadRequestException('رقم الهاتف غير صالح.');
  const current=await this.users.findById(userId);
  if(!current||!current.isActive) throw new BadRequestException('الحساب غير متاح.');
  if((contactType==='email'?current.email?.toLowerCase():current.phone)===value) throw new BadRequestException('بيانات الاتصال الجديدة مطابقة للحالية.');
  if(await this.users.findByIdentifier(value)) throw new ConflictException('رقم الهاتف أو البريد مستخدم في حساب آخر.');
  const changePurpose=contactType==='email'?OtpPurpose.CHANGE_EMAIL:OtpPurpose.CHANGE_PHONE;
  const recent=await this.repo.findOne({where:{userId,purpose:changePurpose,createdAt:MoreThan(new Date(Date.now()-this.resend))},order:{createdAt:'DESC'}});
  if(recent) throw new TooManyRequestsException('انتظر دقيقة قبل طلب رمز جديد.');
  const code=String(randomInt(0,1000000)).padStart(6,'0');
  const row=this.repo.create({userId,target:value,purpose:changePurpose,codeHash:await bcrypt.hash(code,10),expiresAt:new Date(Date.now()+this.ttl),consumedAt:null,attempts:0});
  await this.repo.save(row);
  try { await this.delivery.deliver(value,code,contactType==='email'?'email':'sms'); }
  catch(error){ await this.repo.delete({id:row.id}); throw error; }
  return {message:'تم إرسال رمز التحقق إلى بيانات الاتصال الجديدة.',expiresInSeconds:300};
 }

 async confirmContactChange(userId:string,contactType:'phone'|'email',rawValue:string,code:string){
  const value=contactType==='email'?rawValue.trim().toLowerCase():rawValue.trim();
  const changePurpose=contactType==='email'?OtpPurpose.CHANGE_EMAIL:OtpPurpose.CHANGE_PHONE;
  const row=await this.repo.findOne({where:{userId,purpose:changePurpose,target:value,consumedAt:null,expiresAt:MoreThan(new Date())},order:{createdAt:'DESC'},select:['id','userId','target','purpose','codeHash','expiresAt','consumedAt','attempts','createdAt']});
  if(!row||row.attempts>=this.maxAttempts) throw new BadRequestException('الرمز غير صالح أو منتهي الصلاحية.');
  row.attempts+=1;
  if(!(await bcrypt.compare(code,row.codeHash))){await this.repo.save(row);throw new BadRequestException('الرمز غير صحيح.');}
  if(await this.users.findByIdentifier(value)) throw new ConflictException('بيانات الاتصال أصبحت مستخدمة في حساب آخر.');
  try { await this.users.updateContact(userId,contactType,value); }
  catch(error:any){ if(error?.code==='23505') throw new ConflictException('بيانات الاتصال مستخدمة في حساب آخر.'); throw error; }
  row.consumedAt=new Date(); await this.repo.save(row);
  return {message:contactType==='email'?'تم تحديث البريد الإلكتروني بعد التحقق.':'تم تحديث رقم الهاتف بعد التحقق.'};
 }

 async request(identifier:string,purpose:OtpPurpose){
  const target=this.normalizeTarget(identifier);
  const user=await this.users.findByIdentifier(target);
  const generic={message:'إذا كانت البيانات مرتبطة بحساب صالح فسيتم إرسال الرمز.'};
  if(!user||!user.isActive) return generic;
  if(purpose===OtpPurpose.VERIFY_ACCOUNT&&user.isVerified) return {message:'الحساب موثّق مسبقاً.'};
  if(purpose===OtpPurpose.RESET_PASSWORD&&!user.isVerified) return generic;
  const recent=await this.repo.findOne({where:{userId:user.id,purpose,target,createdAt:MoreThan(new Date(Date.now()-this.resend))},order:{createdAt:'DESC'}});
  if(recent) throw new TooManyRequestsException('انتظر دقيقة قبل طلب رمز جديد');
  const code=String(randomInt(0,1000000)).padStart(6,'0');
  const row=this.repo.create({userId:user.id,target,purpose,
   codeHash:await bcrypt.hash(code,10),expiresAt:new Date(Date.now()+this.ttl),consumedAt:null,attempts:0});
  await this.repo.save(row);
  try {
   await this.delivery.deliver(target,code,target.includes('@')?'email':'sms');
  } catch (error) {
   await this.repo.delete({ id: row.id });
   throw error;
  }
  return {...generic,expiresInSeconds:300};
 }

 async confirm(identifier:string,purpose:OtpPurpose,code:string,newPassword?:string){
  const target=this.normalizeTarget(identifier);
  const user=await this.users.findByIdentifier(target);
  if(!user||!user.isActive) throw new BadRequestException('الرمز غير صالح أو منتهي الصلاحية');
  const row=await this.repo.findOne({where:{userId:user.id,purpose,target,consumedAt:null,expiresAt:MoreThan(new Date())},
   order:{createdAt:'DESC'},select:['id','userId','target','purpose','codeHash','expiresAt','consumedAt','attempts','createdAt']});
  if(!row||row.attempts>=this.maxAttempts) throw new BadRequestException('الرمز غير صالح أو منتهي الصلاحية');
  row.attempts+=1;
  if(!(await bcrypt.compare(code,row.codeHash))){await this.repo.save(row);throw new BadRequestException('الرمز غير صحيح');}
  if(purpose===OtpPurpose.RESET_PASSWORD){
   if(!newPassword||newPassword.length<10) throw new BadRequestException('كلمة المرور يجب أن تكون 10 أحرف على الأقل');
   await this.users.updatePassword(user.id,newPassword);
  }else await this.users.markVerified(user.id);
  row.consumedAt=new Date();
  await this.repo.save(row);
  return {message:purpose===OtpPurpose.VERIFY_ACCOUNT?'تم توثيق الحساب بنجاح.':'تم تغيير كلمة المرور بنجاح.'};
 }
}
