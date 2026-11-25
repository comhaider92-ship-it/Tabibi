from pathlib import Path
root=Path(__file__).parent
screen=(root/'mobile/src/screens/BookingsScreen.tsx').read_text()
checks={
 'patient bookings include all filter': "{key:'all',label:'الكل'}" in screen,
 'patient bookings include upcoming filter': "{key:'upcoming',label:'القادمة واليوم'}" in screen,
 'patient bookings include past filter': "{key:'past',label:'السابقة'}" in screen,
 'patient bookings include cancelled and rejected filter': "{key:'closed',label:'الملغاة والمرفوضة'}" in screen,
 'search field filters provider patient and service': 'matchesSearch' in screen and 'provider} ${person} ${extra}' in screen,
 'date grouping uses Baghdad timezone': "timeZone:'Asia/Baghdad'" in screen,
 'day-only wording retained': 'لا توجد ساعة حضور إلزامية' in screen,
 'no exact appointment time displayed': 'dateStyle:\'full\'' in screen and 'startsAt).toLocaleTimeString' not in screen,
 'cancellation still checks server permission': 'x.canCancel===true' in screen,
 'doctor and facility bookings both loaded': 'api.appointments()' in screen and 'api.myFacilityBookings()' in screen,
 'booking messages remain permission-gated': 'x.canMessage===true' in screen,
 'no queue states or call-next controls': all(x not in screen for x in ['queueStatus','استدعاء التالي','تم استدعاؤك']),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
