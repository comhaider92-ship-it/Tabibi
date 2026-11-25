import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class ModerateRatingDto {
  @IsIn(['published', 'hidden', 'under_review']) status: 'published' | 'hidden' | 'under_review';
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
