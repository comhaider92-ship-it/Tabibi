import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { AdPlacement, AdTargetType } from '../ad.entity';
export class CreateAdDto {
 @IsString() @MinLength(2) @MaxLength(160) advertiserName:string;
 @IsString() @MinLength(2) @MaxLength(160) title:string;
 @IsOptional() @IsString() description?:string;
 @IsOptional() @IsUrl({require_protocol:true}) imageUrl?:string;
 @IsOptional() @IsUrl({require_protocol:true}) targetUrl?:string;
 @IsEnum(AdPlacement) placement:AdPlacement;
 @IsOptional() @IsEnum(AdTargetType) targetType?:AdTargetType;
 @IsOptional() @IsUUID() targetId?:string;
 @IsDateString() startsAt:string;
 @IsDateString() endsAt:string;
 @IsInt() @Min(0) priceIqd:number;
 @IsOptional() @IsInt() @Min(0) paidAmountIqd?:number;
 @IsOptional() @IsString() @MaxLength(120) paymentReference?:string;
 @IsOptional() @IsString() ownerNote?:string;
}
