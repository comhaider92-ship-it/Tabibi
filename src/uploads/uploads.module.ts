import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadAsset } from './upload-asset.entity';
import { MedicalRecordAttachment } from '../medical-records/medical-record-attachment.entity';
import { MedicalRecordShareConsent } from '../medical-records/medical-record-share-consent.entity';
import { MedicalRecord } from '../medical-records/medical-record.entity';
import { MedicalRecordAccessLog } from '../medical-records/medical-record-access-log.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
@Module({
  imports: [TypeOrmModule.forFeature([UploadAsset, MedicalFacility, DoctorProfile, MedicalRecordAttachment, MedicalRecordShareConsent, MedicalRecord, MedicalRecordAccessLog, UsersModule]), AuthModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
