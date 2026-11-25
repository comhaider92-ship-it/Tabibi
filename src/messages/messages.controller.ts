import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { MessagesService } from './messages.service';
import { SendBookingMessageDto } from './dto/send-booking-message.dto';
import { ReportBookingMessageDto } from './dto/report-booking-message.dto';
import { ReviewBookingMessageReportDto } from './dto/review-booking-message-report.dto';
import { SetConversationMuteDto } from './dto/set-conversation-mute.dto';
@Controller('messages')
@UseGuards(JwtAuthGuard,RolesGuard)
export class MessagesController {
 constructor(private readonly service:MessagesService){}
 @Get('appointments/:id') @Roles(UserRole.PATIENT,UserRole.DOCTOR) listAppointment(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole}){return this.service.listAppointment(id,u);}
 @Post('appointments/:id') @Roles(UserRole.PATIENT,UserRole.DOCTOR) sendAppointment(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole},@Body() dto:SendBookingMessageDto){return this.service.sendAppointment(id,u,dto.body);}
 @Get('appointments/:id/unread-count') @Roles(UserRole.PATIENT,UserRole.DOCTOR) unreadAppointment(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole}){return this.service.unreadCount('doctor',id,u);}
 @Patch('appointments/:id/mute') @Roles(UserRole.PATIENT,UserRole.DOCTOR) muteAppointment(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole},@Body() dto:SetConversationMuteDto){return this.service.setMute('doctor',id,u,dto.muted);}
 @Get('facility-bookings/:id') @Roles(UserRole.PATIENT,UserRole.OWNER) listFacility(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole}){return this.service.listFacility(id,u);}
 @Post('facility-bookings/:id') @Roles(UserRole.PATIENT,UserRole.OWNER) sendFacility(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole},@Body() dto:SendBookingMessageDto){return this.service.sendFacility(id,u,dto.body);}
 @Get('facility-bookings/:id/unread-count') @Roles(UserRole.PATIENT,UserRole.OWNER) unreadFacility(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole}){return this.service.unreadCount('facility',id,u);}
 @Patch('facility-bookings/:id/mute') @Roles(UserRole.PATIENT,UserRole.OWNER) muteFacility(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole},@Body() dto:SetConversationMuteDto){return this.service.setMute('facility',id,u,dto.muted);}
 @Post(':messageId/report') @Roles(UserRole.PATIENT,UserRole.DOCTOR,UserRole.OWNER) report(@Param('messageId',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string;role:UserRole},@Body() dto:ReportBookingMessageDto){return this.service.reportMessage(id,u,dto.reason);}
 @Get('owner/reports') @Roles(UserRole.OWNER) ownerReports(){return this.service.ownerReports();}
 @Patch('owner/reports/:id') @Roles(UserRole.OWNER) reviewReport(@Param('id',new ParseUUIDPipe()) id:string,@Body() dto:ReviewBookingMessageReportDto){return this.service.reviewReport(id,dto.status,dto.ownerNote);}
}
