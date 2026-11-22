import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthOtp } from './otp.entity';
import { LoginSecurityEvent } from './login-security-event.entity';
import { AuthSession } from './auth-session.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
@Module({imports:[UsersModule,TypeOrmModule.forFeature([AuthOtp,LoginSecurityEvent,AuthSession])],controllers:[AuthController],
 providers:[AuthService,OtpService,OtpDeliveryService,JwtAuthGuard,RolesGuard],exports:[JwtAuthGuard,RolesGuard]})
export class AuthModule {}
