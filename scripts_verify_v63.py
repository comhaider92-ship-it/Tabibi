from pathlib import Path
root=Path(__file__).parent
booking=(root/'mobile/src/screens/BookingScreen.tsx').read_text()
patient=(root/'mobile/src/screens/BookingsScreen.tsx').read_text()
doctor=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
appointments=(root/'src/appointments/appointments.service.ts').read_text()
facilities=(root/'src/facilities/facilities.service.ts').read_text()
doc=(root/'docs/phase-v63-day-only-patient-booking.md').read_text()
checks={
 'patient booking groups doctor slots into days':'availableDays(slots).map' in booking,
 'patient booking groups facility slots into days':'availableDays(slots).map' in booking,
 'patient selection text explicitly says day only':'اختر يوم المراجعة فقط' in booking,
 'patient confirmation contains day but no slot hour':'يوم المراجعة: ${dayLabel(dayKey(slot.startsAt))}' in booking and 'slotLabel' not in booking,
 'patient bookings list displays date only':'toLocaleDateString' in patient and 'timeStyle' not in patient,
 'patient cancellation UI uses Baghdad day boundary':"timeZone:'Asia/Baghdad'" in patient and 'const future=dayEnd(x.startsAt)>Date.now()' in patient,
 'doctor dashboard displays day only':'يوم المراجعة: {dateText(a.startsAt)}' in doctor and 'timeStyle' not in doctor,
 'doctor upcoming filter is day-based':'futureDay(a.startsAt)' in doctor,
 'doctor completion is available after day starts':'startedDay(a.startsAt)' in doctor,
 'doctor no-show UI waits until day ends':'endedDay(a.startsAt)' in doctor,
 'server calculates Baghdad calendar day':'timeZone: \'Asia/Baghdad\'' in appointments and 'baghdadDayBounds' in appointments,
 'server blocks no-show until day end':'day.end.getTime() > Date.now()' in appointments and 'انتهاء يوم المراجعة بالكامل' in appointments,
 'server allows completion after day start':'day.start.getTime() > Date.now()' in appointments,
 'doctor cancellation server rule is day-based':'baghdadDayBounds(appointment.startsAt).start.getTime()' in appointments,
 'facility cancellation server rule is day-based':'baghdadDayStart(booking.startsAt)' in facilities,
 'facility patient can-cancel rule is day-based':'canCancel:[FacilityBookingStatus.REQUESTED,FacilityBookingStatus.CONFIRMED].includes(booking.status)&&baghdadDayStart(booking.startsAt)>new Date()' in facilities,
 'time-based doctor reminders are disabled':'Day-based bookings intentionally do not schedule clock-time reminders.' in appointments,
 'provider capacity slots are retained':'internal capacity slot' in doc and 'earliest still-available internal capacity slot' in doc,
 'provider schedule screen explains internal-only time slots':'الطاقة الاستيعابية والدوام الداخلي فقط' in (root/'mobile/src/screens/ScheduleManagementScreen.tsx').read_text(),
}
failed=[k for k,v in checks.items() if not v]
print(f'V63 source-contract checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
