import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DoctorsModule } from './doctors/doctors.module';
import { User } from './users/user.entity';
import { Appointment } from './appointments/appointment.entity';
import { AppointmentStatusHistory } from './appointments/appointment-status-history.entity';
import { AuthOtp } from './auth/otp.entity';
import { LoginSecurityEvent } from './auth/login-security-event.entity';
import { AuthSession } from './auth/auth-session.entity';
import { DoctorProfile } from './doctors/doctor-profile.entity';
import { AvailabilitySlot } from './scheduling/availability-slot.entity';
import { SchedulingModule } from './scheduling/scheduling.module';
import { Notification } from './notifications/notification.entity';
import { NotificationDeviceToken } from './notifications/device-token.entity';
import { NotificationPreference } from './notifications/notification-preference.entity';
import { AppointmentReminder } from './notifications/appointment-reminder.entity';
import { DoctorRating } from './ratings/rating.entity';
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MedicalDirectoryModule } from './medical-directory/medical-directory.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { MedicalFacility } from './facilities/facility.entity';
import { FacilityService } from './facilities/facility-service.entity';
import { FacilityBooking } from './facilities/facility-booking.entity';
import { FacilityAvailabilitySlot } from './facilities/facility-slot.entity';
import { WeeklyScheduleRule } from './scheduling/weekly-schedule.entity';
import { ScheduleException } from './scheduling/schedule-exception.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DoctorSubscription } from './subscriptions/subscription.entity';
import { OwnerAuditLog } from './subscriptions/audit-log.entity';
import { Advertisement } from './ads/ad.entity';
import { AdsModule } from './ads/ads.module';
import { BookingMessage } from './messages/message.entity';
import { BookingConversationMute } from './messages/conversation-mute.entity';
import { BookingMessageReport } from './messages/message-report.entity';
import { MessagesModule } from './messages/messages.module';
import { UploadAsset } from './uploads/upload-asset.entity';
import { UploadsModule } from './uploads/uploads.module';
import { MedicalRecord } from './medical-records/medical-record.entity';
import { MedicalRecordAccessLog } from './medical-records/medical-record-access-log.entity';
import { MedicalRecordAttachment } from './medical-records/medical-record-attachment.entity';
import { MedicalRecordShareConsent } from './medical-records/medical-record-share-consent.entity';
import { MedicalPrescription } from './medical-records/medical-prescription.entity';
import { MedicalLabResult } from './medical-records/medical-lab-result.entity';
import { MedicalClinicalReport } from './medical-records/medical-clinical-report.entity';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
@Module({
 controllers: [HealthController],
 imports: [
  ConfigModule.forRoot({
   isGlobal: true,
   validate: (env: Record<string, unknown>) => {
    const secret = String(env.JWT_SECRET || '');
    if (secret.length < 32 || secret === 'replace_with_a_long_random_secret_at_least_32_chars') {
     throw new Error('JWT_SECRET must be a unique random value of at least 32 characters');
    }
    const port = Number(env.PORT ?? 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
     throw new Error('PORT must be an integer between 1 and 65535');
    }
    const nodeEnv = String(env.NODE_ENV ?? 'development');
    if (!['development', 'test', 'production'].includes(nodeEnv)) {
     throw new Error('NODE_ENV must be development, test, or production');
    }
    if (nodeEnv === 'production') {
     const databasePort = Number(env.DATABASE_PORT ?? 5432);
     if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) {
      throw new Error('DATABASE_PORT must be an integer between 1 and 65535');
     }
     for (const key of ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME', 'DATABASE_PASSWORD']) {
      if (!String(env[key] ?? '').trim()) throw new Error(`${key} is required in production`);
     }
     const databasePassword = String(env.DATABASE_PASSWORD);
     if (databasePassword.length < 16 || /^(change_me|password|postgres|admin|replace)/i.test(databasePassword)) {
      throw new Error('DATABASE_PASSWORD must be a unique secret of at least 16 characters in production');
     }
     const ownerEmail = String(env.OWNER_EMAIL ?? '').trim();
     const ownerPassword = String(env.OWNER_PASSWORD ?? '');
     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail) || /example\.com|YOUR_|CHANGE_ME/i.test(ownerEmail)) {
      throw new Error('OWNER_EMAIL must be a real owner email address in production');
     }
     if (ownerPassword.length < 14 || /^(replace|change_me|password|admin)/i.test(ownerPassword)) {
      throw new Error('OWNER_PASSWORD must be a unique password of at least 14 characters in production');
     }
     const uploadsDirectory = String(env.UPLOADS_DIRECTORY ?? '');
     if (!uploadsDirectory.startsWith('/')) {
      throw new Error('UPLOADS_DIRECTORY must be an absolute private path in production');
     }
     const publicApiBaseUrl = String(env.PUBLIC_API_BASE_URL ?? '');
     let publicApi: URL;
     try { publicApi = new URL(publicApiBaseUrl); }
     catch { throw new Error('PUBLIC_API_BASE_URL must be a valid HTTPS URL in production'); }
     if (publicApi.protocol !== 'https:' || !publicApi.pathname.replace(/\/$/, '').endsWith('/api/v1') || /example\.com|YOUR_|CHANGE_ME/i.test(publicApiBaseUrl)) {
      throw new Error('PUBLIC_API_BASE_URL must be a real HTTPS URL ending in /api/v1 in production');
     }
    }
    return { ...env, PORT: String(port), NODE_ENV: nodeEnv };
   },
  }),
  TypeOrmModule.forRootAsync({ inject:[ConfigService], useFactory:(c:ConfigService)=>({
   type:'postgres' as const, host:c.get<string>('DATABASE_HOST','localhost'), port:Number(c.get('DATABASE_PORT','5432')),
   username:c.get<string>('DATABASE_USER','postgres'), password:c.get<string>('DATABASE_PASSWORD',''),
   database:c.get<string>('DATABASE_NAME','tabibi'), entities:[User,Appointment,AppointmentStatusHistory,AuthOtp,LoginSecurityEvent,AuthSession,DoctorProfile,AvailabilitySlot,Notification,NotificationDeviceToken,NotificationPreference,AppointmentReminder,DoctorRating,MedicalFacility,FacilityService,FacilityBooking,FacilityAvailabilitySlot,WeeklyScheduleRule,ScheduleException,DoctorSubscription,OwnerAuditLog,Advertisement,BookingMessage,BookingConversationMute,BookingMessageReport,UploadAsset,MedicalRecord,MedicalRecordAccessLog,MedicalRecordAttachment,MedicalRecordShareConsent,MedicalPrescription,MedicalLabResult,MedicalClinicalReport], synchronize:false,
  })}),
  JwtModule.registerAsync({ global:true, inject:[ConfigService], useFactory:(c:ConfigService)=>({
   secret:c.get<string>('JWT_SECRET'), signOptions:{ expiresIn:c.get<string>('JWT_EXPIRES_IN','30m') as any },
  })}),
  UsersModule, AuthModule, AppointmentsModule, DoctorsModule, SchedulingModule, NotificationsModule, RatingsModule, MedicalDirectoryModule, FacilitiesModule, DashboardModule, SubscriptionsModule, AdsModule, MessagesModule, UploadsModule, MedicalRecordsModule,
 ]
})
export class AppModule {}
