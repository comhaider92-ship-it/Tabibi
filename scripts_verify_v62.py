from pathlib import Path
root=Path(__file__).parent
service=(root/'src/appointments/appointments.service.ts').read_text()
ui=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
checks={
 'no-show is blocked until appointment end':'dto.status === AppointmentStatus.NO_SHOW && day.end.getTime() > Date.now()' in service,
 'server returns a clear no-show timing error':'لا يمكن تسجيل عدم الحضور قبل انتهاء يوم المراجعة بالكامل' in service,
 'doctor ownership check remains enforced':'appointment.doctorId !== user.sub' in service,
 'detail endpoint remains permission-scoped':'user.sub !== appointment.bookedByUserId' in service and 'user.sub !== appointment.doctorId' in service,
 'status history remains chronological':'order: { createdAt: \'ASC\' }' in service,
 'beneficiary phone in detail response is doctor-only':'user.role === UserRole.DOCTOR ? { phone: beneficiary.phone }' in service,
 'mobile API exposes appointment detail endpoint':'appointment: (id:string) => request<any>(`/appointments/${id}`)' in api,
 'mobile appointment list supports date-range filtering':'appointments: (page=1,limit=50,status?:string,from?:string,to?:string)' in api,
 'daily summary fetches all pages for today':'for(let page=2;page<=pages;page++)' in ui,
 'daily summary reports completed and no-show counts':'completed:todayRows.filter' in ui and 'noShow:todayRows.filter' in ui,
 'doctor can expand appointment details':'عرض تفاصيل الحجز وسجل الحالة' in ui,
 'doctor can see status history in detail':'سجل تغيّر الحالة' in ui and 'details[a.id].statusHistory' in ui,
 'no-show action appears only after appointment end':"endedDay(a.startsAt)" in ui,
 'completed action remains available after appointment starts':"startedDay(a.startsAt)" in ui,
}
failed=[k for k,v in checks.items() if not v]
print(f'V62 source-contract checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
