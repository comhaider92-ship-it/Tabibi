import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { UpsertDoctorProfileDto } from './dto/upsert-doctor-profile.dto';
import { ReviewDoctorProfileDto } from './dto/review-doctor-profile.dto';
import { DoctorDirectoryQueryDto } from './dto/doctor-directory-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { SchedulingService } from '../scheduling/scheduling.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService, private readonly scheduling: SchedulingService) {}

  @Get()
  directory(@Query() filters: DoctorDirectoryQueryDto) {
    return this.doctors.publicDirectory(filters);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  myProfile(@CurrentUser() user: { sub: string }) { return this.doctors.myProfile(user.sub); }

  @Post('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  saveProfile(@CurrentUser() user: { sub: string }, @Body() dto: UpsertDoctorProfileDto) {
    return this.doctors.saveMyProfile(user.sub, dto);
  }

  @Post('me/profile/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  submit(@CurrentUser() user: { sub: string }) { return this.doctors.submitMyProfile(user.sub); }

  @Get('owner/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  pending() { return this.doctors.pendingProfiles(); }

  @Get(':id/available-slots')
  async publicSlots(@Param('id', new ParseUUIDPipe()) id: string, @Query('from') from?: string, @Query('to') to?: string) {
    const doctorUserId = await this.doctors.approvedUserIdForProfile(id);
    return this.scheduling.publicOpen(doctorUserId, from, to);
  }

  @Get(':id')
  publicDoctor(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doctors.publicDoctor(id);
  }

  @Patch('owner/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  review(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: ReviewDoctorProfileDto,
  ) { return this.doctors.review(id, user.sub, dto); }
}
