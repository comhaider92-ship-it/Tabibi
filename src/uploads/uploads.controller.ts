import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  upload(@CurrentUser() user: { sub: string; role: UserRole }, @Body() body: any) {
    return this.uploads.upload(user, body);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: { sub: string; role: UserRole }) { return this.uploads.mine(user); }

  @Get('owner/review-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  ownerReviewQueue(@CurrentUser() user: { sub: string; role: UserRole }) { return this.uploads.ownerReviewQueue(user); }

  @Get('public/:id')
  async publicImage(@Param('id') id: string, @Res() response: Response) {
    const result = await this.uploads.getPublicImage(id);
    response.setHeader('Content-Type', result.asset.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=300');
    result.stream.on('error', () => { if (!response.headersSent) response.status(404); response.end(); });
    result.stream.pipe(response);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async download(@Param('id') id: string, @CurrentUser() user: { sub: string; role: UserRole }, @Req() _req: Request, @Res() response: Response) {
    const result = await this.uploads.getForDownload(id, user);
    const safeName = result.asset.originalName.replace(/[\r\n"]/g, '_');
    response.setHeader('Content-Type', result.asset.mimeType);
    response.setHeader('Content-Length', String(result.asset.sizeBytes));
    response.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    result.stream.on('error', () => { if (!response.headersSent) response.status(404); response.end(); });
    result.stream.pipe(response);
  }
}
