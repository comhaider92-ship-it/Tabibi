import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
export class RegisterFacilityManagerDto {
 @IsString() @Length(2,120) displayName:string;
 @IsOptional() @IsEmail() email?:string;
 @IsOptional() @Matches(/^\\+?[0-9]{8,15}$/) phone?:string;
 @IsString() @MinLength(10) password:string;
}
