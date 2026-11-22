import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
export class CreateFacilityServiceDto {
 @IsString() @MinLength(2) @MaxLength(40) serviceCode:string;
 @IsString() @MinLength(2) @MaxLength(160) name:string;
 @IsOptional() @IsInt() @Min(0) priceIqd?:number;
 @IsOptional() @IsInt() @Min(5) @Max(480) expectedDurationMinutes?:number;
}
