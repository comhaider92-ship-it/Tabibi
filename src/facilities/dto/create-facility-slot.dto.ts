import { IsDateString, IsUUID } from 'class-validator';
export class CreateFacilitySlotDto {
 @IsUUID() serviceId:string;
 @IsDateString() startsAt:string;
 @IsDateString() endsAt:string;
}
