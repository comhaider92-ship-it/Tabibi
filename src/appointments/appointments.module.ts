import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentStatusHistory } from './appointment-status-history.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { DoctorProfile } from '../doctors/doctor-profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduleException } from '../scheduling/schedule-exception.entity';
import { DoctorSubscription } from '../subscriptions/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AppointmentStatusHistory, User, DoctorProfile, ScheduleException, DoctorSubscription]), AuthModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
