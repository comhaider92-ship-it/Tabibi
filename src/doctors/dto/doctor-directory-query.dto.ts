import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DoctorDirectoryQueryDto {
  /** General patient search box: doctor name, specialty, or clinic name. */
  @IsOptional() @IsString() @MaxLength(180) q?: string;
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(120) specialty?: string;
  @IsOptional() @IsString() @MaxLength(180) subSpecialty?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(5) minRating?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000000) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
  @IsOptional() @IsIn(['name', 'rating', 'experience', 'newest']) sort?: 'name' | 'rating' | 'experience' | 'newest';
  @IsOptional() @IsIn(['ASC', 'DESC']) order?: 'ASC' | 'DESC';
}
