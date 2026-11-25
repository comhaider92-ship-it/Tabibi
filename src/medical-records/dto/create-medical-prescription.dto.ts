import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class PrescriptionMedicationDto {
  @IsString() @MinLength(2) @MaxLength(160) medicationName: string;
  @IsOptional() @IsString() @MaxLength(80) strength?: string;
  @IsString() @MinLength(1) @MaxLength(120) dosage: string;
  @IsString() @MinLength(1) @MaxLength(120) frequency: string;
  @IsString() @MinLength(1) @MaxLength(120) duration: string;
  @IsOptional() @IsString() @MaxLength(500) instructions?: string;
}

export class CreateMedicalPrescriptionDto {
  @IsUUID() appointmentId: string;
  @IsString() @MinLength(2) @MaxLength(160) title: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => PrescriptionMedicationDto)
  medications: PrescriptionMedicationDto[];
  @IsOptional() @IsString() @MaxLength(3000) generalInstructions?: string;
  @IsOptional() @IsDateString() validUntil?: string;
}
