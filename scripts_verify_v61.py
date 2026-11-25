from pathlib import Path
root=Path(__file__).parent
service=(root/'src/appointments/appointments.service.ts').read_text()
ui=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
checks={
 'doctor-only booker lookup is scoped by role':'user.role === UserRole.DOCTOR' in service and 'bookerIds.length ? this.usersRepo.find' in service,
 'booker identity is resolved from stored bookedByUserId':'appointments.map((a) => a.bookedByUserId)' in service and 'bookerById.get(a.bookedByUserId)' in service,
 'booker response exposes display name only':'bookedBy: (() => { const booker = bookerById.get(a.bookedByUserId); return booker ? { displayName: booker.displayName }' in service,
 'registered beneficiary phone is doctor-only':'user.role === UserRole.DOCTOR ? { phone: beneficiary.phone }' in service,
 'guest beneficiary phone is doctor-only':'user.role === UserRole.DOCTOR ? { phone: a.beneficiaryPhone }' in service,
 'patient list does not receive bookedBy object':'...(user.role === UserRole.DOCTOR ? {' in service and 'bookedBy:' in service,
 'doctor dashboard displays beneficiary name':'المستفيد: {a.beneficiary?.displayName' in ui,
 'doctor dashboard displays beneficiary phone when present':'هاتف المستفيد: {a.beneficiary.phone}' in ui,
 'doctor dashboard distinguishes booking account':'تم الحجز بواسطة: {a.bookedBy.displayName}' in ui,
 'booking status action remains restricted to confirmed appointments':"a.status==='confirmed'&&startedDay(a.startsAt)" in ui,
 'completed/no-show action labels remain available':'تسجيل مكتمل' in ui and 'لم يحضر' in ui,
 'status update refreshes doctor dashboard':'await api.updateAppointmentStatus(id,status);await load();' in ui,
}
failed=[k for k,v in checks.items() if not v]
print(f'V61 doctor booking-context checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
