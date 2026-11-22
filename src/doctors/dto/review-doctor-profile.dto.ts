import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class ReviewDoctorProfileDto {
  @IsIn(['approved', 'rejected']) decision: 'approved' | 'rejected';
  @IsOptional() @IsString() @MaxLength(1500) reviewNote?: string;
}
