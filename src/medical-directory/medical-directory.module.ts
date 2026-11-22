import { Module } from '@nestjs/common';
import { MedicalDirectoryController } from './medical-directory.controller';
@Module({ controllers:[MedicalDirectoryController] })
export class MedicalDirectoryModule {}
