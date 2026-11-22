import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';
export class CreateMedicalShareConsentDto {
  @IsUUID() doctorUserId: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @IsUUID('4', { each: true }) recordIds: string[];
  @IsDateString() expiresAt: string;
  @IsOptional() @IsBoolean() allowDownload?: boolean;
}
