import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
export class ConfirmRenewalPaymentDto {
  @IsBoolean() received: boolean;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
