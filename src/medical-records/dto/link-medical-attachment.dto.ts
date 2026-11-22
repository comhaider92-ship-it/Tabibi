import { IsUUID } from 'class-validator';
export class LinkMedicalAttachmentDto { @IsUUID() uploadAssetId: string; }
