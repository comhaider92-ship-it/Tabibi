import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min } from 'class-validator';
import { AdPlacement, AdStatus, AdTargetType } from '../ad.entity';
export class UpdateAdDto {
 @IsOptional() @IsString() @MaxLength(160) advertiserName?:string;
 @IsOptional() @IsString() @MaxLength(160) title?:string;
 @IsOptional() @IsString() description?:string;
 @IsOptional() @IsUrl({require_protocol:true}) imageUrl?:string;
 @IsOptional() @IsUrl({require_protocol:true}) targetUrl?:string;
 @IsOptional() @IsEnum(AdPlacement) placement?:AdPlacement;
 @IsOptional() @IsEnum(AdTargetType) targetType?:AdTargetType;
 @IsOptional() @IsUUID() targetId?:string|null;
 @IsOptional() @IsEnum(AdStatus) status?:AdStatus;
 @IsOptional() @IsDateString() startsAt?:string;
 @IsOptional() @IsDateString() endsAt?:string;
 @IsOptional() @IsInt() @Min(0) priceIqd?:number;
 @IsOptional() @IsInt() @Min(0) paidAmountIqd?:number;
 @IsOptional() @IsString() @MaxLength(120) paymentReference?:string;
 @IsOptional() @IsString() ownerNote?:string;
}
