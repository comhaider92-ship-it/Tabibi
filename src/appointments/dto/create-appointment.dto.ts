import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateAppointmentDto {
 @IsOptional() @IsUUID() doctorId?:string;
 @IsOptional() @IsUUID() doctorProfileId?:string;
 @IsOptional() @IsUUID() beneficiaryId?:string;
 @IsOptional() @IsString() @MaxLength(120) beneficiaryName?:string;
 @IsOptional() @IsString() @MaxLength(32) beneficiaryPhone?:string;
 @IsDateString() startsAt:string;
 @IsDateString() endsAt:string;
 @IsOptional() @IsString() @MaxLength(1000) patientNote?:string;
}
