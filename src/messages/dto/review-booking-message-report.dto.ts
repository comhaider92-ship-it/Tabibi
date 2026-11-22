import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class ReviewBookingMessageReportDto { @IsIn(['reviewed','dismissed']) status:'reviewed'|'dismissed'; @IsOptional() @IsString() @MaxLength(1000) ownerNote?:string; }
