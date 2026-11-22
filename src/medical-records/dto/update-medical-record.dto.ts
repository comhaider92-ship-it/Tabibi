import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class UpdateMedicalRecordDto {
  @IsOptional() @IsIn(['note', 'diagnosis', 'prescription', 'test_result', 'visit_summary']) recordType?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(12000) content?: string;
}
