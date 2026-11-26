import {
  IsInt, IsOptional, IsString, Length, Max, MaxLength, Min,
} from 'class-validator';

export class UpsertDoctorProfileDto {
  @IsString() @Length(2, 160) fullName: string;
  @IsString() @Length(2, 120) specialty: string;
  @IsOptional() @IsString() @MaxLength(180) subSpecialty?: string;
  @IsOptional() @IsString() @MaxLength(4000) qualifications?: string;
  @IsInt() @Min(0) @Max(70) experienceYears: number;
  @IsOptional() @IsString() @MaxLength(3000) bio?: string;
  @IsString() @Length(2, 180) clinicName: string;
  @IsString() @Length(3, 220) address: string;
  @IsString() @Length(2, 80) city: string;
  @IsOptional() @IsString() @MaxLength(32) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(1000) photoUrl?: string;
}
