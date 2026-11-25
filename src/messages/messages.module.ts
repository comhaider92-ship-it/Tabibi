import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingMessage } from './message.entity';
import { BookingConversationMute } from './conversation-mute.entity';
import { BookingMessageReport } from './message-report.entity';
import { Appointment } from '../appointments/appointment.entity';
import { FacilityBooking } from '../facilities/facility-booking.entity';
import { MedicalFacility } from '../facilities/facility.entity';
import { User } from '../users/user.entity';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({imports:[TypeOrmModule.forFeature([BookingMessage,BookingConversationMute,BookingMessageReport,Appointment,FacilityBooking,MedicalFacility,User]),AuthModule,NotificationsModule],controllers:[MessagesController],providers:[MessagesService]})
export class MessagesModule{}
