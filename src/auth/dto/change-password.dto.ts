import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class ChangePasswordDto {
 @IsString() @MinLength(1) @MaxLength(128) currentPassword:string;
 @IsString() @MinLength(10) @MaxLength(128) @Matches(/^(?=.*[A-Za-z])(?=.*[0-9]).+$/, {message:'كلمة المرور الجديدة يجب أن تحتوي على حرف ورقم على الأقل.'}) newPassword:string;
}
