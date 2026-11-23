import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalFacility } from './facility.entity';
import { FacilityService } from './facility-service.entity';
import { FacilityBooking } from './facility-booking.entity';
import { WeeklyScheduleRule } from '../scheduling/weekly-schedule.entity';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { FacilityAvailabilitySlot } from './facility-slot.entity';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OwnerAuditLog } from '../subscriptions/audit-log.entity';
@Module({imports:[TypeOrmModule.forFeature([MedicalFacility,FacilityService,FacilityBooking,FacilityAvailabilitySlot,WeeklyScheduleRule,ScheduleException,OwnerAuditLog, UsersModule]),AuthModule,NotificationsModule],controllers:[FacilitiesController],providers:[FacilitiesService]})
export class FacilitiesModule{}
