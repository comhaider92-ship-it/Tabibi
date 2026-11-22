import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
export class CreateMedicalLabResultDto {
  @IsUUID() appointmentId: string;
  @IsString() @MinLength(2) @MaxLength(160) testName: string;
  @IsString() @MinLength(1) @MaxLength(1000) resultValue: string;
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
  @IsOptional() @IsString() @MaxLength(120) referenceRange?: string;
  @IsOptional() @IsIn(['low', 'normal', 'high', 'critical', 'positive', 'negative', 'not_interpreted']) interpretation?: string;
  @IsOptional() @IsString() @MaxLength(160) laboratoryName?: string;
  @IsOptional() @IsDateString() performedOn?: string;
  @IsOptional() @IsString() @MaxLength(3000) clinicalComment?: string;
}
