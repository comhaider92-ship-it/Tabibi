import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, StreamableFile, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.OWNER)
  create(@CurrentUser() user: { sub: string; role: string }, @Body() dto: CreateUploadDto) {
    return this.uploads.create(user.sub, user.role, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: { sub: string }) { return this.uploads.mine(user.sub); }

  @Get('owner/review-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  ownerReviewQueue() { return this.uploads.ownerReviewQueue(); }

  @Get('public/:id')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  async publicFile(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.uploads.getFile(id, '', '', true);
    return new StreamableFile(result.buffer, { type: result.asset.mimeType, disposition: 'inline' });
  }

  @Get(':id/download')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  @UseGuards(JwtAuthGuard)
  async download(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: { sub: string; role: string }) {
    const result = await this.uploads.getFile(id, user.sub, user.role);
    const safeName = result.asset.originalName.replace(/[\r\n"\\]/g, '_');
    return new StreamableFile(result.buffer, {
      type: result.asset.mimeType,
      disposition: `attachment; filename="${safeName}"`,
    });
  }
}
