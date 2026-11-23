import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Appointment } from '../appointments/appointment.entity';
import { DoctorRating } from './rating.entity';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorRating, Appointment]), AuthModule, UsersModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
