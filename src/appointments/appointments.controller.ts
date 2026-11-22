import {
  BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch,
  Post, Query, UseGuards,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  create(
    @Body() dto: CreateAppointmentDto,
    @Headers('idempotency-key') key: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    if (!key || key.length > 100) throw new BadRequestException('أرسل Idempotency-Key صالحاً');
    if (dto.doctorProfileId) return this.service.createFromProfile(dto, key, user.sub);
    if (!dto.doctorId) throw new BadRequestException('حدد الطبيب المطلوب للحجز');
    return this.service.create(dto as CreateAppointmentDto & { doctorId: string }, key, user.sub);
  }

  /** Patient sees bookings made by them or made for them; doctor sees their own schedule. */
  @Get()
  @Roles(UserRole.PATIENT, UserRole.DOCTOR)
  list(@Query() filters: ListAppointmentsDto, @CurrentUser() user: { sub: string; role: UserRole }) {
    return this.service.listForUser(user, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.cancel(id, user);
  }
}
