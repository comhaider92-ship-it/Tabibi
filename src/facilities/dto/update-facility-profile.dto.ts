import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class UpdateFacilityProfileDto {
 @IsOptional() @IsString() @MinLength(2) @MaxLength(180) name?:string;
 @IsOptional() @IsString() @IsIn(['laboratory','radiology','diagnostics','imaging','hospital']) facilityType?:string;
 @IsOptional() @IsString() @MinLength(2) @MaxLength(80) city?:string;
 @IsOptional() @IsString() @MinLength(2) @MaxLength(220) address?:string;
 @IsOptional() @IsString() @MaxLength(32) phone?:string|null;
 @IsOptional() @IsString() description?:string|null;
}
