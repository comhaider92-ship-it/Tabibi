import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateFacilityBookingStatusDto {
 @IsIn(['confirmed','rejected']) status:'confirmed'|'rejected';
 @IsOptional() @IsString() @MaxLength(500) reason?:string;
}
