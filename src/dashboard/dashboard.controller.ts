import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  doctor(@CurrentUser() user: { sub: string }, @Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboard.doctor(user.sub, from, to);
  }

  @Get('facilities/:facilityId')
  @Roles(UserRole.OWNER,UserRole.FACILITY_MANAGER)
  facility(@CurrentUser() user: { sub: string; role: UserRole }, @Param('facilityId', new ParseUUIDPipe()) facilityId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboard.facility(user.sub, facilityId, user.role, from, to);
  }
}
