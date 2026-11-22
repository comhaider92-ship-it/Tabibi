import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ModerateRatingDto } from './dto/moderate-rating.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  create(@Body() dto: CreateRatingDto, @CurrentUser() user: { sub: string }) {
    return this.service.create(dto, user.sub);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.OWNER)
  listDoctor(@Param('doctorId', new ParseUUIDPipe()) doctorId: string, @CurrentUser() user: { sub: string; role: UserRole }) {
    return this.service.listDoctor(doctorId, user);
  }

  @Post(':id/report')
  @Roles(UserRole.PATIENT)
  report(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string }) {
    return this.service.report(id, user.sub);
  }

  @Get('owner/review-queue')
  @Roles(UserRole.OWNER)
  reviewQueue() { return this.service.listForOwner(); }

  @Patch(':id/moderate')
  @Roles(UserRole.OWNER)
  moderate(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ModerateRatingDto, @CurrentUser() user: { sub: string }) {
    return this.service.moderate(id, dto, user.sub);
  }
}
