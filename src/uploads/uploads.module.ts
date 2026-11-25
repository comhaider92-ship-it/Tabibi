import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { MedicalRecordAttachment } from '../medical-records/medical-record-attachment.entity';
import { MedicalRecord } from '../medical-records/medical-record.entity';
import { MedicalRecordShareConsent } from '../medical-records/medical-record-share-consent.entity';
import { MedicalRecordAccessLog } from '../medical-records/medical-record-access-log.entity';
import { UploadAsset } from './upload-asset.entity';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadAsset, DoctorProfile, MedicalFacility, MedicalRecordAttachment, MedicalRecord, MedicalRecordShareConsent, MedicalRecordAccessLog]), AuthModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [TypeOrmModule, UploadsService],
})
export class UploadsModule {}
