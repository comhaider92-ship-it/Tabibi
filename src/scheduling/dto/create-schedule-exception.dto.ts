import { IsISO8601, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
export class CreateScheduleExceptionDto {
  @IsISO8601({ strict: true }) @Matches(ISO_WITH_OFFSET) startsAt: string;
  @IsISO8601({ strict: true }) @Matches(ISO_WITH_OFFSET) endsAt: string;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string;
  @IsOptional() @IsUUID() serviceId?: string;
  @IsOptional() @IsString() @MaxLength(240) reason?: string;
}
