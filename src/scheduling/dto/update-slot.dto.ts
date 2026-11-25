import { IsISO8601, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateSlotDto {
 @IsOptional() @IsISO8601() startsAt?: string;
 @IsOptional() @IsISO8601() endsAt?: string;
 @IsOptional() @IsIn(['open','closed']) status?: 'open'|'closed';
 @IsOptional() @IsString() @MaxLength(240) note?: string | null;
}
