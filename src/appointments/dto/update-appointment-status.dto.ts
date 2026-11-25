import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';
export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus) status: AppointmentStatus;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
