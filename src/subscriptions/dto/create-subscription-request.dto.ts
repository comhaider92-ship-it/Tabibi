import { IsInt, IsOptional, IsString, IsUrl, Max, Min, MaxLength } from 'class-validator';
export class CreateSubscriptionRequestDto {
 @IsInt() @Min(1) @Max(365) durationDays:number;
 @IsInt() @Min(1) @Max(100000000) amountIqd:number;
 @IsOptional() @IsString() @MaxLength(120) transferReference?:string;
 @IsOptional() @IsUrl({require_tld:false}) proofUrl?:string;
 @IsOptional() @IsString() @MaxLength(1000) doctorNote?:string;
}
