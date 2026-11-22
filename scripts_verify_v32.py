from pathlib import Path
root=Path(__file__).parent
checks=[]
def check(name,ok):
    checks.append((name,bool(ok)))

controller=(root/'src/facilities/facilities.controller.ts').read_text()
service=(root/'src/facilities/facilities.service.ts').read_text()
client=(root/'mobile/src/api/client.ts').read_text()
app=(root/'mobile/App.tsx').read_text()
login=(root/'mobile/src/screens/LoginScreen.tsx').read_text()
dash=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
check('owner-only facility listing route', "@Get('owner/mine')" in controller and "@Roles(UserRole.OWNER)" in controller and 'myFacilities(@CurrentUser()' in controller)
check('facility listing scoped to authenticated owner', 'where:{ownerUserId:ownerId}' in service)
check('doctor dashboard API client', "'/dashboard/doctor'" in client)
check('owner dashboard API client', "'/facilities/owner/mine'" in client and '`/dashboard/facilities/${id}`' in client)
check('doctor appointment status API', '`/appointments/${id}/status`' in client and "status:'completed'|'no_show'" in client)
check('facility accept/reject API', "'/facilities/owner/bookings/'+id+'/status'" in client and "'confirmed'|'rejected'" in client)
check('login supports authenticated provider roles', "onLogin(r.user.role)" in login and "r.user.role!=='patient'" not in login)
check('app restores doctor and owner roles', "['patient','doctor','owner'].includes(user.role)" in app)
check('app routes doctor and owner dashboards', 'DoctorDashboardScreen' in app and 'OwnerDashboardScreen' in app and "role==='doctor'" in app and "role==='owner'" in app)
check('doctor dashboard shows summary and appointments', 'doctorDashboard()' in dash and ('api.appointments()' in dash or 'api.appointments(1,50)' in dash) and 'حجوزات المرضى' in dash)
check('doctor completion actions restricted to due confirmed appointments', "a.status==='confirmed'&&new Date(a.startsAt).getTime()<=Date.now()" in dash and "'completed'" in dash and "'no_show'" in dash)
check('owner dashboard accepts and rejects pending requests', 'ownerFacilityBookings(id)' in dash and "decide(b.id,'confirmed')" in dash and "decide(b.id,'rejected')" in dash)
check('dashboard does not expose another owner facilities', 'ownerUserId:ownerId' in service)

for name,ok in checks:
    print(('PASS' if ok else 'FAIL')+' '+name)
print(f'V32: {sum(ok for _,ok in checks)}/{len(checks)}')
raise SystemExit(0 if all(ok for _,ok in checks) else 1)
