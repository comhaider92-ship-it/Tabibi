import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Public facility search. `q` is the simple patient-facing search box. */
export class FacilityDirectoryQueryDto {
  @IsOptional() @IsString() @MaxLength(160) q?: string;
  @IsOptional() @IsString() @MaxLength(180) name?: string;
  @IsOptional() @IsString() @MaxLength(160) serviceName?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(40) type?: string;
}
