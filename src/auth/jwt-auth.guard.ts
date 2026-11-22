import { Injectable, UnauthorizedException, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthSession } from './auth-session.entity';
@Injectable()
export class JwtAuthGuard implements CanActivate {
 constructor(private readonly jwt:JwtService,private readonly users:UsersService,@InjectRepository(AuthSession) private readonly sessions:Repository<AuthSession>){}
 async canActivate(ctx:ExecutionContext):Promise<boolean> {
  const req=ctx.switchToHttp().getRequest();
  const header=req.headers.authorization as string|undefined;
  if(!header?.startsWith('Bearer ')) throw new UnauthorizedException('يلزم تسجيل الدخول');
  try {
   const payload=this.jwt.verify(header.slice(7));
   if(!payload?.sub || !payload?.jti) throw new UnauthorizedException('جلسة الدخول غير صالحة أو منتهية');
   const user=await this.users.findById(payload.sub);
   if(!user||!user.isActive) throw new UnauthorizedException('تم إيقاف هذا الحساب؛ يرجى مراجعة إدارة التطبيق');
   if((payload.tokenVersion??0)!==(user.tokenVersion??0)) throw new UnauthorizedException('انتهت صلاحية هذه الجلسة؛ سجل الدخول من جديد.');
   const session=await this.sessions.findOne({where:{jti:payload.jti,userId:user.id,revokedAt:IsNull()}});
   if(!session || session.tokenVersion!==(user.tokenVersion??0) || session.expiresAt<=new Date()) throw new UnauthorizedException('تم إنهاء هذه الجلسة أو انتهت صلاحيتها؛ سجل الدخول مجدداً.');
   if(Date.now()-session.lastSeenAt.getTime()>5*60*1000){session.lastSeenAt=new Date();await this.sessions.save(session);}
   req.user={sub:user.id,role:user.role,jti:payload.jti};
   return true;
  } catch (error) {
   if(error instanceof UnauthorizedException) throw error;
   throw new UnauthorizedException('جلسة الدخول غير صالحة أو منتهية');
  }
 }
}
