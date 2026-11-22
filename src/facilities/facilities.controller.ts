import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { CreateFacilityServiceDto } from './dto/create-facility-service.dto';
import { CreateFacilityBookingDto } from './dto/create-facility-booking.dto';
import { ReviewFacilityDto } from './dto/review-facility.dto';
import { FacilityDirectoryQueryDto } from './dto/facility-directory-query.dto';
import { CreateFacilitySlotDto } from './dto/create-facility-slot.dto';
import { FacilitySlotsQueryDto } from './dto/facility-slots-query.dto';
import { SaveWeeklyScheduleDto, GenerateFacilitySlotsDto } from '../scheduling/dto/weekly-schedule.dto';
import { UpdateFacilityBookingStatusDto } from './dto/update-facility-booking-status.dto';
import { CreateScheduleExceptionDto } from '../scheduling/dto/create-schedule-exception.dto';
import { UpdateFacilitySlotStatusDto } from './dto/update-facility-slot-status.dto';
import { UpdateFacilityServiceDto } from './dto/update-facility-service.dto';
import { UpdateFacilityProfileDto } from './dto/update-facility-profile.dto';

@Controller('facilities')
export class FacilitiesController {
 constructor(private readonly facilities:FacilitiesService){}
 @Get() directory(@Query() filters:FacilityDirectoryQueryDto){return this.facilities.directory(filters);}
 @Get('owner/pending') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) pendingFacilities(){return this.facilities.pendingFacilities();}
 @Patch('owner/:id/profile') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) updateProfile(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Body() dto:UpdateFacilityProfileDto){return this.facilities.updateFacilityProfile(u.sub,id,dto);}
 @Get('owner/:id/services') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) ownerServices(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string){return this.facilities.ownerServices(u.sub,id);}
 @Get('owner/:id/services/:serviceId/weekly-schedule') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) ownerWeekly(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Param('serviceId',new ParseUUIDPipe()) serviceId:string){return this.facilities.ownerWeeklySchedule(u.sub,id,serviceId);}
 @Get('owner/mine')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 myFacilities(@CurrentUser() u:{sub:string}){return this.facilities.myFacilities(u.sub);}
 @Get(':id/services') services(@Param('id',new ParseUUIDPipe()) id:string){return this.facilities.servicesFor(id);}
 @Get(':id/weekly-schedule') weekly(@Param('id',new ParseUUIDPipe()) id:string,@Query('serviceId') serviceId?:string){return this.facilities.publicWeeklySchedule(id,serviceId);}
 @Get(':id/slots') slots(@Param('id',new ParseUUIDPipe()) id:string,@Query() filters:FacilitySlotsQueryDto){return this.facilities.publicSlots(id,filters);}
 @Post()
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 create(@CurrentUser() u:{sub:string},@Body() dto:CreateFacilityDto){return this.facilities.createFacility(u.sub,dto);}
 @Get('owner/:id/schedule-exceptions') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) ownerExceptions(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string){return this.facilities.ownerScheduleExceptions(u.sub,id);}
 @Post('owner/:id/schedule-exceptions') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) createException(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Body() dto:CreateScheduleExceptionDto){return this.facilities.createScheduleException(u.sub,id,dto);}
 @Patch('owner/:id/schedule-exceptions/:exceptionId/restore') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) restoreException(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Param('exceptionId',new ParseUUIDPipe()) exceptionId:string){return this.facilities.restoreScheduleException(u.sub,id,exceptionId);}
 @Post('owner/:id/services/:serviceId/weekly-schedule')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 saveWeekly(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Param('serviceId',new ParseUUIDPipe()) serviceId:string,@Body() dto:SaveWeeklyScheduleDto){return this.facilities.saveWeeklySchedule(u.sub,id,serviceId,dto);}
 @Post('owner/:id/services/:serviceId/generate-slots')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 generateSlots(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Param('serviceId',new ParseUUIDPipe()) serviceId:string,@Body() dto:GenerateFacilitySlotsDto){return this.facilities.generateFacilitySlots(u.sub,id,serviceId,dto);}
 @Patch('owner/:id/services/:serviceId')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 updateService(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Param('serviceId',new ParseUUIDPipe()) serviceId:string,@Body() dto:UpdateFacilityServiceDto){return this.facilities.updateService(u.sub,id,serviceId,dto);}
 @Post(':id/services')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 addService(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Body() dto:CreateFacilityServiceDto){return this.facilities.addService(u.sub,id,dto);}
 @Get('owner/:id/slots') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) ownerSlots(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Query('serviceId') serviceId?:string,@Query('from') from?:string,@Query('to') to?:string){return this.facilities.ownerSlots(u.sub,id,serviceId,from,to);}
 @Patch('owner/:id/slots/:slotId/status') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER) updateSlotStatus(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Param('slotId',new ParseUUIDPipe()) slotId:string,@Body() dto:UpdateFacilitySlotStatusDto){return this.facilities.updateOwnerSlotStatus(u.sub,id,slotId,dto.status);}
 @Post('owner/:id/slots')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 createSlot(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Body() dto:CreateFacilitySlotDto){return this.facilities.createSlot(u.sub,id,dto);}
 @Get('owner/:id/bookings')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 ownerBookings(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string,@Query('status') status?:string){return this.facilities.ownerBookings(u.sub,id,status);}
 @Patch('owner/bookings/:bookingId/status')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 updateBooking(@CurrentUser() u:{sub:string},@Param('bookingId',new ParseUUIDPipe()) id:string,@Body() dto:UpdateFacilityBookingStatusDto){return this.facilities.updateBookingStatus(u.sub,id,dto);}
 @Patch('bookings/:id/cancel')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.PATIENT)
 cancelBooking(@CurrentUser() u:{sub:string},@Param('id',new ParseUUIDPipe()) id:string){return this.facilities.cancelPatientBooking(u.sub,id);}
 @Patch('owner/:id/review')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)
 review(@Param('id',new ParseUUIDPipe()) id:string,@CurrentUser() u:{sub:string},@Body() dto:ReviewFacilityDto){return this.facilities.reviewFacility(id,dto.status,u.sub);}
 @Post('bookings')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.PATIENT)
 book(@CurrentUser() u:{sub:string},@Headers('idempotency-key') key:string,@Body() dto:CreateFacilityBookingDto){return this.facilities.createBooking(u.sub,key,dto);}
 @Get('bookings/mine')
 @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.PATIENT)
 mine(@CurrentUser() u:{sub:string}){return this.facilities.myBookings(u.sub);}
}
