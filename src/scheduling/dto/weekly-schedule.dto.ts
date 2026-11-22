import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class WeeklyBreakDto {
 @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime:string;
 @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime:string;
}
export class WeeklyScheduleRuleDto {
 @IsInt() @Min(0) @Max(6) weekday:number;
 @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime:string;
 @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime:string;
 @IsOptional() @IsArray() @ArrayMaxSize(4) @ValidateNested({each:true}) @Type(()=>WeeklyBreakDto) breaks?:WeeklyBreakDto[];
 @IsOptional() @IsString() @MaxLength(64) timezone?:string;
}
export class SaveWeeklyScheduleDto {
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(42) @ValidateNested({each:true}) @Type(()=>WeeklyScheduleRuleDto) rules:WeeklyScheduleRuleDto[];
}
export class GenerateFacilitySlotsDto {
 @Matches(/^\d{4}-\d{2}-\d{2}$/) from:string;
 @Matches(/^\d{4}-\d{2}-\d{2}$/) to:string;
}
