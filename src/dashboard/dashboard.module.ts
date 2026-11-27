import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Appointment } from '../appointments/appointment.entity';
import { AvailabilitySlot } from '../scheduling/availability-slot.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { FacilityBooking } from '../facilities/facility-booking.entity';
import { FacilityAvailabilitySlot } from '../facilities/facility-slot.entity';
import { FacilityService } from '../facilities/facility-service.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AvailabilitySlot, DoctorProfile, ScheduleException, MedicalFacility, FacilityBooking, FacilityAvailabilitySlot, FacilityService]), AuthModule, UsersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
