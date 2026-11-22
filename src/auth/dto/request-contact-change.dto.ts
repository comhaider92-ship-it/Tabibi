import { IsIn, IsString, Length } from 'class-validator';
export class RequestContactChangeDto {
 @IsIn(['phone','email']) contactType:'phone'|'email';
 @IsString() @Length(3,254) value:string;
}
