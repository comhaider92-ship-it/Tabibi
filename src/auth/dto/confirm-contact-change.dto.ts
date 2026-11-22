import { IsIn, IsString, Length, Matches } from 'class-validator';
export class ConfirmContactChangeDto {
 @IsIn(['phone','email']) contactType:'phone'|'email';
 @IsString() @Length(3,254) value:string;
 @Matches(/^[0-9]{6}$/) code:string;
}
