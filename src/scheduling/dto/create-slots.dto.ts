import { ArrayMaxSize, ArrayMinSize, IsArray, IsISO8601, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class SlotInputDto {
 @IsISO8601() startsAt: string;
 @IsISO8601() endsAt: string;
 @IsOptional() @IsString() @MaxLength(240) note?: string;
}
export class CreateSlotsDto {
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({each:true}) @Type(()=>SlotInputDto) slots: SlotInputDto[];
}
