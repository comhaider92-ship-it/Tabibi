import { IsIn, IsString, Length } from 'class-validator';
export class RequestOtpDto {
 @IsString() @Length(3,254) identifier:string;
 @IsIn(['verify_account','reset_password']) purpose:'verify_account'|'reset_password';
}
