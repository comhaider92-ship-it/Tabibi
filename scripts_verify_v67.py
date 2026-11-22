from pathlib import Path
root=Path(__file__).parent
screen=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
checks={
 'doctor dashboard reads first page and discovers total pages': 'api.appointments(1,50)' in screen and 'first.pagination?.totalPages' in screen,
 'doctor dashboard loads every appointment page': 'for(let page=2;page<=pages;page++)' in screen and 'rows.push(...(next.items??[]))' in screen,
 'today summary derives from fully loaded appointments': 'const todayRows=rows.filter' in screen,
 'today filter is available': "['today','حجوزات اليوم']" in screen,
 'upcoming filter remains confirmed-only': "future&&a.status==='confirmed'" in screen,
 'search includes beneficiary name and phone': 'a.beneficiary?.displayName' in screen and 'a.beneficiary?.phone' in screen,
 'search includes booking account name': 'a.bookedBy?.displayName' in screen,
 'search includes patient note': 'a.patientNote' in screen,
 'appointments count reflects filtered results': 'حجوزات المرضى ({visible.length})' in screen,
 'day-only date handling remains Baghdad based': "timeZone:'Asia/Baghdad'" in screen and 'يوم المراجعة:' in screen,
 'no exact time is exposed in dashboard': 'toLocaleTimeString' not in screen,
 'no queue state or call-next feature': all(x not in screen for x in ['queueStatus','استدعاء التالي','تم استدعاؤك','تم استدعائه']),
 'doctor status actions retain day boundary': "startedDay(a.startsAt)" in screen and "endedDay(a.startsAt)" in screen,
 'booking details and messages retained': 'toggleDetails(a.id)' in screen and 'BookingMessages kind="doctor"' in screen,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
