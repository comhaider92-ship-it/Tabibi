import { IsBase64, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { UploadCategory } from '../upload-asset.entity';
export class CreateUploadDto {
  @IsString() @IsNotEmpty() @MaxLength(100) fileName: string;
  @IsString() @MaxLength(80) mimeType: string;
  @IsBase64() @MaxLength(14 * 1024 * 1024) base64: string;
  @IsIn(Object.values(UploadCategory)) category: UploadCategory;
  @IsOptional() @IsUUID() facilityId?: string;
}
