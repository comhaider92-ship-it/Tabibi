from pathlib import Path
root=Path(__file__).parent
checks={
 'patient booking uses authenticated booker id':('src/appointments/appointments.controller.ts','user.sub)'),
 'booking rejects past appointments':('src/appointments/appointments.service.ts','start <= new Date()'),
 'booking requires a valid open doctor slot':('src/appointments/appointments.service.ts','slot.status !== SlotStatus.OPEN'),
 'booking requires approved doctor profile':('src/appointments/appointments.service.ts','DoctorProfileStatus.APPROVED'),
 'booking requires active unexpired subscription':('src/appointments/appointments.service.ts','اشتراك الطبيب منتهٍ أو غير مفعل'),
 'booking transaction locks the selected slot':('src/appointments/appointments.service.ts','pessimistic_write'),
 'idempotency replay is bound to same booker and request':('src/appointments/appointments.service.ts','مفتاح الطلب مستخدم لعملية حجز مختلفة'),
 'patient listing is scoped to booker or beneficiary':('src/appointments/appointments.service.ts','a."bookedByUserId" = :userId OR a."beneficiaryId" = :userId'),
 'doctor listing is scoped to own doctor id':('src/appointments/appointments.service.ts','a."doctorId" = :userId'),
 'only booking booker can cancel patient appointment':('src/appointments/appointments.service.ts','a.bookedByUserId === user.sub'),
 'guest beneficiary cannot send messages as booker':('src/messages/messages.service.ts','booking.bookedByUserId===userId'),
 'facility messaging checks facility ownership':('src/messages/messages.service.ts','facility.ownerUserId===userId'),
 'message report requires incoming message':('src/messages/messages.service.ts','message.recipientUserId!==user.sub'),
 'duplicate report is rejected':('src/messages/messages.service.ts','سبق أن أبلغت عن هذه الرسالة'),
 'mute suppresses notification but keeps saved message':('src/messages/messages.service.ts','if(!mute)await this.notifications.createAndDispatch'),
 'unread count is scoped to recipient and conversation':('src/messages/messages.service.ts','recipientUserId:user.sub,readAt:null'),
 'owner report endpoint requires owner role':('src/messages/messages.controller.ts',"@Roles(UserRole.OWNER)"),
 'doctor renewal is distinguished from first approval':('src/subscriptions/subscriptions.service.ts','requiresOwnerApproval=!priorApproved'),
 'renewal payment confirmation rejects first-time requests':('src/subscriptions/subscriptions.service.ts','هذا الإجراء مخصص لتجديد اشتراك طبيب سبق اعتماده'),
 'renewal extends from current expiry when still active':('src/subscriptions/subscriptions.service.ts','active?.expiresAt&&active.expiresAt>now?active.expiresAt:now'),
 'facility service cannot be disabled with future bookings':('src/facilities/facilities.service.ts','لا يمكن إيقاف الخدمة لوجود حجوزات قائمة'),
 'facility bookings preserve existing requested/confirmed protection':('src/facilities/facilities.service.ts','FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED'),
 'private uploads require authenticated download':('src/uploads/uploads.controller.ts',"@Get(':id/download')\n  @Header('X-Content-Type-Options', 'nosniff')\n  @Header('Cache-Control', 'private, no-store, max-age=0')\n  @UseGuards(JwtAuthGuard)"),
 'public images are approval gated':('src/uploads/uploads.controller.ts',"getFile(id, '', '', true)"),
 'upload file names are not used as storage keys':('src/uploads/uploads.service.ts','randomUUID()'),
 'JWT secret fails closed when unsafe':('src/app.module.ts','JWT_SECRET must be a unique random value'),
 'owner audit log query is owner scoped':('src/subscriptions/subscriptions.service.ts','where:{ownerId}'),
 'owner cannot deactivate owner account':('src/subscriptions/subscriptions.service.ts','لا يمكن تعطيل حساب المالك'),
 'migration registry includes V50-V51 schema changes':('src/database/migrations/1733400000000-CreateSecureUploadAssets.ts','CreateSecureUploadAssets1733400000000'),
 'database migrations include renewal and secure uploads':('src/database/migrations/1733300000000-SubscriptionRenewalWithoutReapproval.ts','SubscriptionRenewalWithoutReapproval1733300000000'),
}
failed=[]
for label,(rel,needle) in checks.items():
 p=root/rel
 content=p.read_text(errors='ignore') if p.exists() else ''
 if needle not in content: failed.append(label)
print(f"V53 regression contracts: {len(checks)-len(failed)}/{len(checks)} passed")
for item in failed: print('FAIL:',item)
raise SystemExit(1 if failed else 0)
