import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() list(@CurrentUser() user: any, @Query() filters: ListNotificationsDto) { return this.service.list(user.sub, filters); }
  @Get('unread-count') unread(@CurrentUser() user: any) { return this.service.unreadCount(user.sub); }
  @Patch(':id/read') markRead(@Param('id') id: string, @CurrentUser() user: any) { return this.service.markRead(id, user.sub); }
  @Patch('read-all') markAllRead(@CurrentUser() user: any) { return this.service.markAllRead(user.sub); }
  @Post('devices') registerDevice(@CurrentUser() user: any, @Body() dto: RegisterDeviceTokenDto) { return this.service.registerDevice(user.sub, dto); }
  @Delete('devices/:id') removeDevice(@CurrentUser() user: any, @Param('id') id: string) { return this.service.removeDevice(user.sub, id); }
  @Get('preferences') preferences(@CurrentUser() user: any) { return this.service.getPreferences(user.sub); }
  @Post('preferences') updatePreferences(@CurrentUser() user: any, @Body() dto: UpdateNotificationPreferencesDto) { return this.service.updatePreferences(user.sub, dto); }
}
