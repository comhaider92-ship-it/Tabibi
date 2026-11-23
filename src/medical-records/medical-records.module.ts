import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Appointment } from '../appointments/appointment.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { UploadAsset } from '../uploads/upload-asset.entity';
import { MedicalRecord } from './medical-record.entity';
import { MedicalRecordAccessLog } from './medical-record-access-log.entity';
import { MedicalRecordAttachment } from './medical-record-attachment.entity';
import { MedicalRecordShareConsent } from './medical-record-share-consent.entity';
import { MedicalPrescription } from './medical-prescription.entity';
import { MedicalLabResult } from './medical-lab-result.entity';
import { MedicalClinicalReport } from './medical-clinical-report.entity';
import { User } from '../users/user.entity';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalPrescriptionVerificationController } from './medical-prescription-verification.controller';
import { MedicalRecordsService } from './medical-records.service';
@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord, MedicalRecordAccessLog, Appointment, MedicalRecordAttachment, MedicalRecordShareConsent, UploadAsset, DoctorProfile, MedicalPrescription, MedicalLabResult, MedicalClinicalReport, User, UsersModule]), AuthModule],
  controllers: [MedicalRecordsController, MedicalPrescriptionVerificationController], providers: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
