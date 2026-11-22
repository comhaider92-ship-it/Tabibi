import { ConflictException, Injectable, UnauthorizedException, OnModuleInit, TooManyRequestsException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';
import { createHmac, randomUUID } from 'crypto';
import { LoginSecurityEvent } from './login-security-event.entity';
import { AuthSession } from './auth-session.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService implements OnModuleInit {
 constructor(private readonly users:UsersService,private readonly jwt:JwtService,private readonly config:ConfigService,@InjectRepository(LoginSecurityEvent) private readonly securityEvents:Repository<LoginSecurityEvent>,@InjectRepository(AuthSession) private readonly sessions:Repository<AuthSession>){}
 async onModuleInit(){
  const email=this.config.get<string>('OWNER_EMAIL')?.trim().toLowerCase();
  const password=this.config.get<string>('OWNER_PASSWORD');
  const phone=this.config.get<string>('OWNER_PHONE')?.trim()||null;
  if(!email || !password) return;
  const existing=await this.users.findOwnerByEmail(email);
  if(existing && existing.role!==UserRole.OWNER){
   throw new Error('OWNER_EMAIL is already assigned to a non-owner account. Use a dedicated owner email; existing accounts are never promoted automatically.');
  }
  if(!existing){
   await this.users.create({email,phone,displayName:'مالك النظام',
    passwordHash:await bcrypt.hash(password,12),role:UserRole.OWNER,isVerified:true,isActive:true});
  }
 }
 async register(dto:RegisterDto){
  if(!dto.email && !dto.phone) throw new ConflictException('أدخل البريد الإلكتروني أو رقم الهاتف على الأقل');
  if(dto.email && await this.users.findByIdentifier(dto.email)) throw new ConflictException('البريد أو الهاتف مستخدم مسبقاً');
  if(dto.phone && await this.users.findByIdentifier(dto.phone)) throw new ConflictException('رقم الهاتف مستخدم مسبقاً');
  const user=await this.users.create({
   displayName:dto.displayName,email:dto.email?.toLowerCase()??null,phone:dto.phone??null,
   passwordHash:await bcrypt.hash(dto.password,12),role:UserRole.PATIENT,isVerified:false,isActive:true
  });
  return {id:user.id,displayName:user.displayName,role:user.role,isVerified:user.isVerified,
   message:'تم إنشاء الحساب. يلزم توثيق رقم الهاتف أو البريد قبل تفعيل جميع الخدمات.'};
 }
 async login(identifier:string,password:string,ipAddress:string='unknown',userAgent:string|null=null){
  const normalized=identifier.trim().toLowerCase();
  const secret=this.config.getOrThrow<string>('JWT_SECRET');
  const digest=(value:string)=>createHmac('sha256',secret).update(value).digest('hex');
  const identifierHash=digest(normalized);
  const ipHash=digest(ipAddress||'unknown');
  const since=new Date(Date.now()-15*60*1000);
  const identifierFailures=await this.securityEvents.count({where:{identifierHash,succeeded:false,createdAt:MoreThan(since)}});
  const ipFailures=await this.securityEvents.count({where:{ipHash,succeeded:false,createdAt:MoreThan(since)}});
  if(identifierFailures>=5||ipFailures>=30) throw new TooManyRequestsException('تم إيقاف محاولات تسجيل الدخول مؤقتاً لحماية الحساب. حاول مجدداً بعد 15 دقيقة.');

  const user=await this.users.findByIdentifier(identifier.trim());
  const passwordMatches=!!user && await bcrypt.compare(password,user.passwordHash);
  const valid=!!user && !!user.isActive && passwordMatches;
  await this.securityEvents.save(this.securityEvents.create({identifierHash,ipHash,succeeded:valid}));
  if(!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
  if(user.role===UserRole.PATIENT && !user.isVerified)
   throw new UnauthorizedException('يرجى توثيق الحساب برمز التحقق قبل تسجيل الدخول.');
  const expiresIn=this.config.get<string>('JWT_EXPIRES_IN','30m');
  const jti=randomUUID();
  const accessToken=await this.jwt.signAsync({sub:user.id,role:user.role,tokenVersion:user.tokenVersion||0},{jwtid:jti});
  const duration=this.durationMs(expiresIn);
  const now=new Date();
  await this.sessions.save(this.sessions.create({userId:user.id,jti,tokenVersion:user.tokenVersion||0,userAgent:(userAgent||'').slice(0,200)||null,ipHash,createdAt:now,lastSeenAt:now,expiresAt:new Date(now.getTime()+duration),revokedAt:null}));
  return {accessToken,tokenType:'Bearer',expiresIn,
   user:{id:user.id,displayName:user.displayName,role:user.role,isVerified:user.isVerified}};
 }

 private durationMs(value:string):number {
  const match=/^(\d+)(s|m|h|d)?$/i.exec(String(value||'30m').trim());
  if(!match) return 30*60*1000;
  const amount=Number(match[1]);
  const unit=(match[2]||'s').toLowerCase();
  const factor=unit==='d'?86400000:unit==='h'?3600000:unit==='m'?60000:1000;
  return Math.min(Math.max(amount*factor,60000),30*86400000);
 }
 async listMySessions(userId:string,currentJti:string){
  const now=new Date();
  const user=await this.users.findById(userId);
  if(!user) return [];
  const rows=await this.sessions.find({where:{userId,revokedAt:IsNull(),expiresAt:MoreThan(now)},order:{lastSeenAt:'DESC'},take:50});
  return rows.filter(row=>row.expiresAt>now && row.tokenVersion===(user.tokenVersion||0)).map(row=>({id:row.id,device:this.deviceLabel(row.userAgent),createdAt:row.createdAt,lastSeenAt:row.lastSeenAt,expiresAt:row.expiresAt,isCurrent:row.jti===currentJti}));
 }
 private deviceLabel(agent:string|null):string {
  if(!agent) return 'جهاز أو تطبيق غير محدد';
  if(/android/i.test(agent)) return 'هاتف Android';
  if(/iphone|ipad|ios/i.test(agent)) return 'جهاز Apple';
  if(/windows/i.test(agent)) return 'حاسوب Windows';
  if(/macintosh|mac os/i.test(agent)) return 'حاسوب Mac';
  if(/linux/i.test(agent)) return 'جهاز Linux';
  return 'متصفح أو تطبيق آخر';
 }
 async revokeMySession(userId:string,sessionId:string){
  const session=await this.sessions.findOne({where:{id:sessionId,userId,revokedAt:IsNull()}});
  if(!session) return false;
  session.revokedAt=new Date();
  await this.sessions.save(session);
  return true;
 }
 async recentLoginSecurityEvents(){
  const rows=await this.securityEvents.find({order:{createdAt:'DESC'},take:50,select:['id','succeeded','createdAt']});
  return rows.map(row=>({id:row.id,result:row.succeeded?'success':'failed',createdAt:row.createdAt}));
 }
 async myLoginSecurityActivity(userId:string){
  const user=await this.users.findById(userId);
  if(!user) throw new UnauthorizedException('الحساب غير موجود.');
  const secret=this.config.getOrThrow<string>('JWT_SECRET');
  const identifiers=[user.email,user.phone].filter((value):value is string=>!!value).map(value=>createHmac('sha256',secret).update(value.trim().toLowerCase()).digest('hex'));
  if(!identifiers.length) return [];
  const rows=await this.securityEvents.find({where:{identifierHash:In(identifiers)},order:{createdAt:'DESC'},take:30,select:['id','succeeded','createdAt']});
  return rows.map(row=>({id:row.id,result:row.succeeded?'success':'failed',createdAt:row.createdAt}));
 }
}
