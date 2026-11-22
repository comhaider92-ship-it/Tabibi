from pathlib import Path
root=Path(__file__).parent
service=(root/'src/facilities/facilities.service.ts').read_text()
controller=(root/'src/facilities/facilities.controller.ts').read_text()
mobile=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
checks={
 'facility decision locks booking row':'setLock(\'pessimistic_write\')' in service and "where('b.id=:id',{id:bookingId})" in service,
 'facility decision verifies ownership':'this.ownedFacility(ownerId,booking.facilityId)' in service,
 'only requested bookings can be decided':'booking.status!==FacilityBookingStatus.REQUESTED' in service,
 'rejection requires a non-empty reason':"if(dto.status==='rejected'&&!rejectionReason) throw new BadRequestException('يرجى كتابة سبب رفض طلب الحجز" in service,
 'reason is trimmed before persistence':'booking.statusNote=dto.reason?.trim() || null' in service,
 'rejection safely releases slot':'await this.releaseFacilitySlotIfUnused(manager,booking)' in service,
 'confirmation and rejection notifications differ':'NotificationType.FACILITY_BOOKING_CONFIRMED' in service and 'NotificationType.FACILITY_BOOKING_REJECTED' in service,
 'rejection reason is included in patient notification':'سبب: ${result.booking.statusNote}' in service,
 'facility decision route remains owner-only':"@Roles(UserRole.OWNER)" in controller and "updateBooking(@CurrentUser() u:{sub:string}" in controller,
 'mobile provides a rejection reason field':'سبب الرفض (مطلوب عند رفض الطلب)' in mobile,
 'mobile blocks rejection without a reason':"status==='rejected'&&!reason" in mobile,
 'mobile passes reason to API':'api.updateFacilityBooking(id,status,reason||undefined)' in mobile,
 'API serializes decision reason':'JSON.stringify({status,reason})' in api,
 'mobile displays stored rejection reason':'سبب الرفض: {b.statusNote}' in mobile,
 'reason field respects server max length':'maxLength={500}' in mobile,
}
failed=[k for k,v in checks.items() if not v]
print(f'V59 facility decision and rejection-reason checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
