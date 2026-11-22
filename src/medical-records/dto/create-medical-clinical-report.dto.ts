import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class ClinicalReportSectionDto {
  @IsString() @MinLength(2) @MaxLength(120) heading: string;
  @IsString() @MinLength(1) @MaxLength(5000) body: string;
}

export class CreateMedicalClinicalReportDto {
  @IsUUID() appointmentId: string;
  @IsIn(['visit', 'diagnosis', 'follow_up', 'imaging', 'medical_summary']) reportKind: string;
  @IsString() @MinLength(3) @MaxLength(180) title: string;
  @IsString() @MinLength(3) @MaxLength(5000) summary: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ClinicalReportSectionDto)
  sections: ClinicalReportSectionDto[];
  @IsOptional() @IsString() @MaxLength(5000) recommendations?: string;
  @IsOptional() @IsString() @MaxLength(5000) followUpPlan?: string;
  @IsOptional() @IsDateString() nextReviewDate?: string;
}
