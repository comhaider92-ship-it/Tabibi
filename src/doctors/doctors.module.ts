import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { UploadAsset } from '../uploads/upload-asset.entity';
import { DoctorRating } from '../ratings/rating.entity';
import { OwnerAuditLog } from '../subscriptions/audit-log.entity';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { UsersModule } from '../users/users.module';
@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile, DoctorRating, OwnerAuditLog, UploadAsset]), AuthModule, NotificationsModule, SchedulingModule, UsersModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule {}
