import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';import { RolesGuard } from '../auth/roles.guard';import { Roles } from '../auth/roles.decorator';import { CurrentUser } from '../auth/current-user.decorator';import { UserRole } from '../users/user.entity';
import { SubscriptionsService } from './subscriptions.service';import { CreateSubscriptionRequestDto } from './dto/create-subscription-request.dto';import { ReviewSubscriptionDto } from './dto/review-subscription.dto';import { FinanceService } from './finance.service';import { UpdateUserStatusDto } from './dto/update-user-status.dto';import { ConfirmRenewalPaymentDto } from './dto/confirm-renewal-payment.dto';
@Controller() @UseGuards(JwtAuthGuard,RolesGuard)
export class SubscriptionsController {constructor(private readonly service:SubscriptionsService,private readonly finance:FinanceService){}
 @Post('doctors/me/subscriptions') @Roles(UserRole.DOCTOR) request(@CurrentUser()u:{sub:string},@Body()dto:CreateSubscriptionRequestDto){return this.service.request(u.sub,dto);}
 @Get('doctors/me/subscriptions') @Roles(UserRole.DOCTOR) mine(@CurrentUser()u:{sub:string}){return this.service.mySubscriptions(u.sub);}
 @Get('doctors/me/subscription-status') @Roles(UserRole.DOCTOR) status(@CurrentUser()u:{sub:string}){return this.service.currentStatus(u.sub);}
 @Get('owner/finance/report') @Roles(UserRole.OWNER) financeReport(@Query('from')from?:string,@Query('to')to?:string){return this.finance.report(from,to);}
 @Get('owner/summary') @Roles(UserRole.OWNER) summary(){return this.service.summary();}
 @Get('owner/subscriptions') @Roles(UserRole.OWNER) subscriptions(@Query('status')status?:string){return this.service.listSubscriptions(status);}
 @Patch('owner/subscriptions/:id/review') @Roles(UserRole.OWNER) review(@Param('id',new ParseUUIDPipe())id:string,@CurrentUser()u:{sub:string},@Body()dto:ReviewSubscriptionDto){return this.service.review(id,u.sub,dto);}
 @Patch('owner/subscriptions/:id/renewal-payment') @Roles(UserRole.OWNER) renewalPayment(@Param('id',new ParseUUIDPipe())id:string,@CurrentUser()u:{sub:string},@Body()body:ConfirmRenewalPaymentDto){return this.service.confirmRenewalPayment(id,u.sub,body.received,body.note);}
 @Get('owner/users') @Roles(UserRole.OWNER) users(@Query('role')role?:string){return this.service.listUsers(role);}
 @Get('owner/users/:id/details') @Roles(UserRole.OWNER) userDetails(@Param('id',new ParseUUIDPipe())id:string){return this.service.userDetails(id);}
 @Patch('owner/users/:id/status') @Roles(UserRole.OWNER) statusUser(@Param('id',new ParseUUIDPipe())id:string,@CurrentUser()u:{sub:string},@Body()body:UpdateUserStatusDto){return this.service.setUserActive(id,u.sub,body.isActive);}
 @Get('owner/audit-logs') @Roles(UserRole.OWNER) audit(@CurrentUser()u:{sub:string}){return this.service.auditTrail(u.sub);}
}
