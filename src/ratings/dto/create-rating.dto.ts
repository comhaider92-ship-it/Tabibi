import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
export class CreateRatingDto {
  @IsUUID() appointmentId: string;
  @IsInt() @Min(1) @Max(5) stars: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}
