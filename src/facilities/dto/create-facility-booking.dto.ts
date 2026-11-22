import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
export class CreateFacilityBookingDto {
 @IsUUID() facilityId:string;
 @IsUUID() serviceId:string;
 @IsUUID() slotId:string;
 @IsString() @MinLength(2) @MaxLength(120) patientName:string;
 @IsOptional() @IsString() @MaxLength(32) patientPhone?:string;
 @IsOptional() @IsString() @MaxLength(1000) patientNote?:string;
}
