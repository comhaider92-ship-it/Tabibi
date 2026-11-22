import { IsEnum } from 'class-validator';
import { FacilityStatus } from '../facility.entity';
export class ReviewFacilityDto {
 @IsEnum(FacilityStatus) status:FacilityStatus;
}
