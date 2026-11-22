from pathlib import Path
root=Path(__file__).parent
checks={
 'no queue fields in appointment entity': 'queueStatus' not in (root/'src/appointments/appointment.entity.ts').read_text(),
 'no queue fields in facility entity': 'queueStatus' not in (root/'src/facilities/facility-booking.entity.ts').read_text(),
 'no queue notification enum': 'QUEUE_TURN_CALLED' not in (root/'src/notifications/notification.entity.ts').read_text(),
 'no doctor call-next API': 'queue/call-next' not in (root/'src/appointments/appointments.controller.ts').read_text(),
 'no doctor queue-status API': 'queue-status' not in (root/'src/appointments/appointments.controller.ts').read_text(),
 'no facility queue APIs': '/queue/' not in (root/'src/facilities/facilities.controller.ts').read_text(),
 'no doctor queue notification dispatch': 'QUEUE_TURN_CALLED' not in (root/'src/appointments/appointments.service.ts').read_text(),
 'no facility queue notification dispatch': 'تم استدعاؤك الآن' not in (root/'src/facilities/facilities.service.ts').read_text(),
 'no mobile queue APIs': all(x not in (root/'mobile/src/api/client.ts').read_text() for x in ['callNextAppointment','updateAppointmentQueue','callNextFacility','updateFacilityQueue']),
 'no mobile queue controls or statuses': all(x not in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text() for x in ['queueChange','queueLabel','استدعاء المراجع التالي','حالة الدور']),
 'patient dashboard contains no queue state': 'queueStatus' not in (root/'mobile/src/screens/BookingsScreen.tsx').read_text(),
 'database cleanup migration exists': (root/'src/database/migrations/1733600000000-RemoveDailyQueueStates.ts').exists(),
 'doctor daily booking list remains': 'حجوزات المرضى' in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text(),
 'facility booking list remains': 'طلبات الحجوزات' in (root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text(),
 'normal appointment lifecycle preserved': all(x in (root/'src/appointments/appointment.entity.ts').read_text() for x in ['CONFIRMED','CANCELLED','COMPLETED','NO_SHOW']),
 'day-only booking remains': 'اختر يوم المراجعة فقط' in (root/'mobile/src/screens/BookingScreen.tsx').read_text(),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
