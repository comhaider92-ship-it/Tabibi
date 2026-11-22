from pathlib import Path
root=Path(__file__).parent
fac=(root/'src/facilities/facilities.service.ts').read_text()
app=(root/'src/appointments/appointments.service.ts').read_text()
mobile=(root/'mobile/src/screens/BookingsScreen.tsx').read_text()
checks={
 'facility cancellation locks booking row':'setLock(\'pessimistic_write\')' in fac and "where('b.id=:id',{id:bookingId})" in fac,
 'facility cancellation remains booker-only':'booking.bookedByUserId!==userId' in fac,
 'facility cancellation only requested or confirmed':'[FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED].includes(booking.status)' in fac,
 'facility cancellation rejects started appointments':'baghdadDayStart(booking.startsAt)<=new Date()' in fac,
 'facility slot is locked before release':'releaseFacilitySlotIfUnused(manager,booking)' in fac and 'slotRepo.createQueryBuilder(\'slot\').setLock(\'pessimistic_write\')' in fac,
 'facility slot is not reopened when another active booking exists':'b.slotId=:slotId AND b.id<>:bookingId' in fac and 'FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED' in fac,
 'facility slot release respects active schedule exceptions':'e.serviceId IS NULL OR e.serviceId=:serviceId' in fac and 'slot.status=closure?FacilitySlotStatus.CLOSED:FacilitySlotStatus.AVAILABLE' in fac,
 'facility rejection also uses safe slot release':'booking.status=FacilityBookingStatus.REJECTED; await this.releaseFacilitySlotIfUnused(manager,booking)' in fac,
 'facility cancel sends owner notification':'NotificationType.FACILITY_BOOKING_CANCELLED' in fac,
 'facility patient cancellation API remains present':"cancelPatientBooking(u.sub,id)" in (root/'src/facilities/facilities.controller.ts').read_text(),
 'doctor appointment cancellation checks booker or assigned doctor':'user.sub !== appointment.bookedByUserId && user.sub !== appointment.doctorId' in app,
 'appointment cancellation rejects non-confirmed state':'appointment.status !== AppointmentStatus.CONFIRMED' in app,
 'appointment cancellation rejects past or started slots':'baghdadDayBounds(appointment.startsAt).start.getTime() <= Date.now()' in app,
 'appointment availability slot is pessimistically locked':'setLock(\'pessimistic_write\')' in app and 'slot."doctorId" = :doctorId' in app,
 'appointment slot is not reopened if another confirmed booking exists':'otherConfirmed===0' in app and 'other.status=:status' in app,
 'appointment slot restoration respects schedule exception':'slot.status = closure ? SlotStatus.CLOSED : SlotStatus.OPEN' in app,
 'appointment reminders are skipped after cancellation':'ReminderStatus.SKIPPED' in app,
 'patient booking UI only offers server-authorized cancellation':'x.canCancel===true' in mobile and 'إلغاء الحجز' in mobile,
}
failed=[k for k,v in checks.items() if not v]
print(f'V58 cancellation and slot integrity checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
