from pathlib import Path
root=Path(__file__).parent
checks={
 'appointment entities have no queue state fields': 'queueStatus' not in (root/'src/appointments/appointment.entity.ts').read_text() and 'queueUpdatedAt' not in (root/'src/appointments/appointment.entity.ts').read_text(),
 'facility entities have no queue state fields': 'queueStatus' not in (root/'src/facilities/facility-booking.entity.ts').read_text() and 'queueUpdatedAt' not in (root/'src/facilities/facility-booking.entity.ts').read_text(),
 'doctor queue call endpoint removed': "queue/call-next" not in (root/'src/appointments/appointments.controller.ts').read_text(),
 'doctor queue status endpoint removed': "queue-status" not in (root/'src/appointments/appointments.controller.ts').read_text(),
 'facility queue endpoints removed': '/queue/' not in (root/'src/facilities/facilities.controller.ts').read_text(),
 'doctor queue notifications removed': 'QUEUE_TURN_CALLED' not in (root/'src/notifications/notification.entity.ts').read_text() and 'QUEUE_TURN_CALLED' not in (root/'src/appointments/appointments.service.ts').read_text(),
 'facility queue notifications removed': 'تم استدعاؤك الآن' not in (root/'src/facilities/facilities.service.ts').read_text(),
 'mobile doctor queue actions removed': 'استدعاء المراجع التالي' not in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text() and 'queueChange' not in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text(),
 'mobile patient queue states removed': 'queueStatus' not in (root/'mobile/src/screens/BookingsScreen.tsx').read_text(),
 'mobile queue APIs removed': all(x not in (root/'mobile/src/api/client.ts').read_text() for x in ['callNextAppointment','updateAppointmentQueue','callNextFacility','updateFacilityQueue']),
 'database cleanup migration added': (root/'src/database/migrations/1733600000000-RemoveDailyQueueStates.ts').exists(),
 'day-only booking contract preserved': 'اختر يوم المراجعة فقط' in (root/'mobile/src/screens/BookingScreen.tsx').read_text(),
 'normal appointment status history preserved': 'statusHistory' in (root/'src/appointments/appointments.service.ts').read_text(),
 'daily booking list retained for doctors': 'حجوزات المرضى' in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text(),
 'daily facility booking list retained': 'طلبات الحجوزات' in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text(),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
