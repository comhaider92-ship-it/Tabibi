import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class CreateFacilityDto {
 @IsString() @MinLength(2) @MaxLength(180) name:string;
 @IsString() @IsIn(['laboratory','radiology','diagnostics','imaging','hospital']) facilityType:string;
 @IsString() @MaxLength(80) city:string;
 @IsString() @MaxLength(220) address:string;
 @IsOptional() @IsString() @MaxLength(32) phone?:string;
 @IsOptional() @IsString() description?:string;
}
