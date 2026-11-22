import { Body, Controller, Delete, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { CreateMedicalShareConsentDto } from './dto/create-medical-share-consent.dto';
import { LinkMedicalAttachmentDto } from './dto/link-medical-attachment.dto';
import { CreateMedicalPrescriptionDto } from './dto/create-medical-prescription.dto';
import { CreateMedicalLabResultDto } from './dto/create-medical-lab-result.dto';
import { CreateMedicalClinicalReportDto } from './dto/create-medical-clinical-report.dto';
import { HealthFileQueryDto } from './dto/health-file-query.dto';
import { MedicalRecordsService } from './medical-records.service';

@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordsController {
  constructor(private readonly service: MedicalRecordsService) {}
  @Get() list(@CurrentUser() user: { sub: string; role: UserRole }, @Query('appointmentId') appointmentId?: string) { return this.service.list(user, appointmentId); }
  @Get('health-file') healthFile(@CurrentUser() user: { sub: string; role: UserRole }, @Query() query: HealthFileQueryDto) { return this.service.healthFile(user, query); }
  @Get('access-history') history(@CurrentUser() user: { sub: string; role: UserRole }) { return this.service.accessHistory(user); }
  @Post() create(@CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: CreateMedicalRecordDto) { return this.service.create(user, dto); }
  @Post('prescriptions') createPrescription(@CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: CreateMedicalPrescriptionDto) { return this.service.createPrescription(user, dto); }
  @Get('prescriptions/:recordId/print')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  printPrescription(@Param('recordId', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.printPrescription(id, user); }
  @Get('prescriptions/:recordId') getPrescription(@Param('recordId', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.getPrescription(id, user); }
  @Post('reports') createClinicalReport(@CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: CreateMedicalClinicalReportDto) { return this.service.createClinicalReport(user, dto); }
  @Get('reports/:recordId') getClinicalReport(@Param('recordId', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.getClinicalReport(id, user); }
  @Get('reports/:recordId/print')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  printClinicalReport(@Param('recordId', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.printClinicalReport(id, user); }
  @Post('lab-results') createLabResult(@CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: CreateMedicalLabResultDto) { return this.service.createLabResult(user, dto); }
  @Get('lab-results/:recordId') getLabResult(@Param('recordId', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.getLabResult(id, user); }
  @Patch(':id') update(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: UpdateMedicalRecordDto) { return this.service.update(id, user, dto); }
  @Delete(':id') remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.remove(id, user); }

  @Post('share-consents') grantShare(@CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: CreateMedicalShareConsentDto) { return this.service.grantShare(user, dto); }
  @Get('share-consents') listShares(@CurrentUser() user: { sub: string; role: UserRole }) { return this.service.listShares(user); }
  @Delete('share-consents/:id') revokeShare(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.revokeShare(id, user); }
  @Delete('share-consents/:id/records/:recordId') revokeSharedRecord(@Param('id', new ParseUUIDPipe()) id: string, @Param('recordId', new ParseUUIDPipe()) recordId: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.revokeSharedRecord(id, recordId, user); }
  @Get('shared-with-me') sharedWithMe(@CurrentUser() user: { sub: string; role: UserRole }) { return this.service.sharedWithMe(user); }
  @Post(':id/attachments') linkAttachment(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: LinkMedicalAttachmentDto) { return this.service.linkAttachment(id, dto.uploadAssetId, user); }
  @Get(':id/attachments') listAttachments(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.listAttachments(id, user); }
  @Delete(':id/attachments/:uploadAssetId') unlinkAttachment(@Param('id', new ParseUUIDPipe()) id: string, @Param('uploadAssetId', new ParseUUIDPipe()) uploadAssetId: string, @CurrentUser() user: { sub: string; role: UserRole }) { return this.service.unlinkAttachment(id, uploadAssetId, user); }
}
