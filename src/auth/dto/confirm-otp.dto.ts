import { IsIn, IsString, Length, Matches, MinLength, ValidateIf } from 'class-validator';
export class ConfirmOtpDto {
 @IsString() @Length(3,254) identifier:string;
 @IsIn(['verify_account','reset_password']) purpose:'verify_account'|'reset_password';
 @Matches(/^[0-9]{6}$/) code:string;
 @ValidateIf(o=>o.purpose==='reset_password')
 @IsString() @MinLength(10) newPassword?:string;
}
