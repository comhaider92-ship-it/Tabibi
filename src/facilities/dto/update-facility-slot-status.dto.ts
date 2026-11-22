import { IsIn } from 'class-validator';
export class UpdateFacilitySlotStatusDto { @IsIn(['available','closed']) status:'available'|'closed'; }
