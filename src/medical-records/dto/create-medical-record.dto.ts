import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
export class CreateMedicalRecordDto {
  @IsIn(['note', 'diagnosis', 'prescription', 'test_result', 'visit_summary']) recordType: string;
  @IsString() @MinLength(2) @MaxLength(160) title: string;
  @IsString() @MinLength(1) @MaxLength(12000) content: string;
  @IsOptional() @IsUUID() appointmentId?: string;
}
