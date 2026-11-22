import { IsDateString, IsOptional, IsUUID } from 'class-validator';
export class FacilitySlotsQueryDto {
 @IsOptional() @IsUUID() serviceId?:string;
 @IsDateString() from:string;
 @IsDateString() to:string;
}
