import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './notification.entity';
import { NotificationDeviceToken } from './device-token.entity';
import { NotificationPreference } from './notification-preference.entity';
import { AppointmentReminder } from './appointment-reminder.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReminderWorkerService } from './reminder-worker.service';
import { FirebasePushService } from './push/firebase-push.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationDeviceToken, NotificationPreference, AppointmentReminder, User]), AuthModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, ReminderWorkerService, FirebasePushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
