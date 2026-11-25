import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { AppointmentStatusHistory } from '../appointments/appointment-status-history.entity';
import { AuthOtp } from '../auth/otp.entity';
import { LoginSecurityEvent } from '../auth/login-security-event.entity';
import { AuthSession } from '../auth/auth-session.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { AvailabilitySlot } from '../scheduling/availability-slot.entity';
import { Notification } from '../notifications/notification.entity';
import { NotificationDeviceToken } from '../notifications/device-token.entity';
import { NotificationPreference } from '../notifications/notification-preference.entity';
import { AppointmentReminder } from '../notifications/appointment-reminder.entity';
import { DoctorRating } from '../ratings/rating.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { FacilityService } from '../facilities/facility-service.entity';
import { FacilityBooking } from '../facilities/facility-booking.entity';
import { FacilityAvailabilitySlot } from '../facilities/facility-slot.entity';
import { WeeklyScheduleRule } from '../scheduling/weekly-schedule.entity';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { DoctorSubscription } from '../subscriptions/subscription.entity';
import { OwnerAuditLog } from '../subscriptions/audit-log.entity';
import { Advertisement } from '../ads/ad.entity';
import { BookingMessage } from '../messages/message.entity';
import { BookingConversationMute } from '../messages/conversation-mute.entity';
import { BookingMessageReport } from '../messages/message-report.entity';
import { UploadAsset } from '../uploads/upload-asset.entity';
import { MedicalRecord } from '../medical-records/medical-record.entity';
import { MedicalRecordAccessLog } from '../medical-records/medical-record-access-log.entity';
import { MedicalRecordAttachment } from '../medical-records/medical-record-attachment.entity';
import { MedicalRecordShareConsent } from '../medical-records/medical-record-share-consent.entity';
import { MedicalPrescription } from '../medical-records/medical-prescription.entity';
import { MedicalLabResult } from '../medical-records/medical-lab-result.entity';
import { MedicalClinicalReport } from '../medical-records/medical-clinical-report.entity';
export default new DataSource({
 type:'postgres', host:process.env.DATABASE_HOST??'localhost', port:Number(process.env.DATABASE_PORT??5432),
 username:process.env.DATABASE_USER??'postgres', password:process.env.DATABASE_PASSWORD??'',
 database:process.env.DATABASE_NAME??'tabibi', entities:[User,Appointment,AppointmentStatusHistory,AuthOtp,LoginSecurityEvent,AuthSession,DoctorProfile,AvailabilitySlot,Notification,NotificationDeviceToken,NotificationPreference,AppointmentReminder,DoctorRating,MedicalFacility,FacilityService,FacilityBooking,FacilityAvailabilitySlot,WeeklyScheduleRule,ScheduleException,DoctorSubscription,OwnerAuditLog,Advertisement,BookingMessage,BookingConversationMute,BookingMessageReport,UploadAsset,MedicalRecord,MedicalRecordAccessLog,MedicalRecordAttachment,MedicalRecordShareConsent,MedicalPrescription,MedicalLabResult,MedicalClinicalReport],
 migrations:['src/database/migrations/*.ts'], synchronize:false,
});
