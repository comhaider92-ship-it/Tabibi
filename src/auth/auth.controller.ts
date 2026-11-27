import { Body, Controller, Get, Post, UseGuards, Req, Param, ParseUUIDPipe } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterFacilityManagerDto } from './dto/register-facility-manager.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { ConfirmOtpDto } from './dto/confirm-otp.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { RequestContactChangeDto } from './dto/request-contact-change.dto';
import { ConfirmContactChangeDto } from './dto/confirm-contact-change.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UnauthorizedException } from '@nestjs/common';
import { ForbiddenException, Patch } from '@nestjs/common';
import { OtpPurpose } from './otp.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
@Controller('auth')
export class AuthController {
 constructor(private readonly auth:AuthService,private readonly otp:OtpService,private readonly users:UsersService){}
 @Post('register') register(@Body() dto:RegisterDto){return this.auth.register(dto);}
 @Post('login') login(@Body() dto:LoginDto,@Req() req:Request){return this.auth.login(dto.identifier,dto.password,req.ip||'unknown',String(req.headers['user-agent']||''));}
 @Post('facility-manager/register') registerFacilityManager(@Body() dto:RegisterFacilityManagerDto){return this.auth.registerFacilityManager(dto);}
 @Get('owner/facility-managers/pending') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 pendingFacilityManagers(){return this.users.listPendingFacilityManagers();}
 @Patch('owner/facility-managers/:id/approve') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 async approveFacilityManager(@Param('id',new ParseUUIDPipe()) id:string){
  const user=await this.users.approveFacilityManager(id);
  if(!user) throw new UnauthorizedException('طلب مدير المنشأة غير موجود أو تمت معالجته.');
  return {id:user.id,displayName:user.displayName,role:user.role,isActive:user.isActive,isVerified:user.isVerified,message:'تم اعتماد حساب مدير المنشأة. يمكنه تسجيل الدخول الآن.'};
 }
 @Get('owner/security/login-events') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 recentLoginSecurityEvents(){return this.auth.recentLoginSecurityEvents();}
 @Get('me/sessions') @UseGuards(JwtAuthGuard)
 mySessions(@CurrentUser() user:{sub:string;jti:string}){return this.auth.listMySessions(user.sub,user.jti);}
 @Post('me/sessions/:id/revoke') @UseGuards(JwtAuthGuard)
 async revokeMySession(@CurrentUser() user:{sub:string},@Req() req:Request){
  const id=String(req.params['id']||'');
  const revoked=await this.auth.revokeMySession(user.sub,id);
  if(!revoked) throw new UnauthorizedException('الجلسة غير موجودة أو منتهية مسبقاً.');
  return {message:'تم إنهاء الجلسة المحددة.'};
 }
 @Get('me/security/activity') @UseGuards(JwtAuthGuard)
 myLoginSecurityActivity(@CurrentUser() user:{sub:string}){return this.auth.myLoginSecurityActivity(user.sub);}
 @Post('otp/request') requestOtp(@Body() dto:RequestOtpDto){return this.otp.request(dto.identifier,dto.purpose as OtpPurpose);}
 @Post('otp/confirm') confirmOtp(@Body() dto:ConfirmOtpDto){return this.otp.confirm(dto.identifier,dto.purpose as OtpPurpose,dto.code,dto.newPassword);}
 @Patch('me/profile') @UseGuards(JwtAuthGuard)
 async updatePatientProfile(@CurrentUser() authUser:{sub:string},@Body() dto:UpdatePatientProfileDto){
  const user=await this.users.findById(authUser.sub);
  if(!user) return null;
  if(user.role!=='patient') throw new ForbiddenException('تعديل هذا الملف متاح لحساب المريض فقط.');
  const updated=await this.users.updateDisplayName(user.id,dto.displayName);
  if(!updated) throw new UnauthorizedException('تعذر تحديث بيانات الحساب.');
  return {id:updated.id,displayName:updated.displayName,email:updated.email,phone:updated.phone,role:updated.role,isVerified:updated.isVerified};
 }
 @Post('me/password/change') @UseGuards(JwtAuthGuard)
 async changePassword(@CurrentUser() user:{sub:string},@Body() dto:ChangePasswordDto){
  if(dto.currentPassword===dto.newPassword) throw new ForbiddenException('كلمة المرور الجديدة يجب أن تختلف عن الحالية.');
  const changed=await this.users.changePassword(user.sub,dto.currentPassword,dto.newPassword);
  if(!changed) throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة.');
  return {message:'تم تغيير كلمة المرور. تم إنهاء الجلسات السابقة؛ سجل الدخول مجدداً.'};
 }
 @Post('me/sessions/revoke-all') @UseGuards(JwtAuthGuard)
 async revokeAllSessions(@CurrentUser() user:{sub:string}){
  await this.users.revokeAllSessions(user.sub);
  return {message:'تم تسجيل الخروج من جميع الأجهزة والجلسات.'};
 }
 @Post('me/contact-change/request') @UseGuards(JwtAuthGuard)
 requestContactChange(@CurrentUser() user:{sub:string},@Body() dto:RequestContactChangeDto){return this.otp.requestContactChange(user.sub,dto.contactType,dto.value);}
 @Post('me/contact-change/confirm') @UseGuards(JwtAuthGuard)
 confirmContactChange(@CurrentUser() user:{sub:string},@Body() dto:ConfirmContactChangeDto){return this.otp.confirmContactChange(user.sub,dto.contactType,dto.value,dto.code);}
 @Get('me') @UseGuards(JwtAuthGuard)
 async me(@CurrentUser() authUser:{sub:string}){
  const user=await this.users.findById(authUser.sub);
  if(!user)return null;
  return {id:user.id,displayName:user.displayName,email:user.email,phone:user.phone,role:user.role,isVerified:user.isVerified};
 }
}
