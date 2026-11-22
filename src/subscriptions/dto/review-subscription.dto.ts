import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class ReviewSubscriptionDto {
 @IsIn(['approved','rejected']) decision:'approved'|'rejected';
 @IsOptional() @IsInt() @Min(1) @Max(365) durationDays?:number;
 @IsOptional() @IsString() @MaxLength(1000) reviewNote?:string;
}
