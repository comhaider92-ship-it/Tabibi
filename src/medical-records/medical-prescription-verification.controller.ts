import { Controller, Get, Header, Param } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';

// Deliberately public: returns issuer and document validity only, never patient identity or clinical contents.
@Controller('medical-records/verify')
export class MedicalPrescriptionVerificationController {
  constructor(private readonly service: MedicalRecordsService) {}
  @Get('report/:token')
  @Header('Cache-Control', 'no-store, max-age=0')
  @Header('X-Content-Type-Options', 'nosniff')
  verifyReport(@Param('token') token: string) { return this.service.verifyClinicalReportToken(token); }

  @Get(':token')
  @Header('Cache-Control', 'no-store, max-age=0')
  @Header('X-Content-Type-Options', 'nosniff')
  verify(@Param('token') token: string) { return this.service.verifyPrescriptionToken(token); }
}
