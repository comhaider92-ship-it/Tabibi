from pathlib import Path
root=Path(__file__).parent
files={
 'doctor screen':'mobile/src/screens/ProviderDashboardScreen.tsx',
 'API client':'mobile/src/api/client.ts',
 'docs':'docs/phase-v48-doctor-dashboard-workflow.md',
}
s={k:(root/v).read_text(errors='ignore') for k,v in files.items()}
checks={
 'doctor dashboard fetches a validated 50-item page':"api.appointments(1,50)" in s['doctor screen'] and "appointments: (page=1,limit=50,status?:string)" in s['API client'],
 'API pagination query includes page and limit':"queryString({page:String(page),limit:String(limit),status})" in s['API client'],
 'future appointments are sorted first':"if(xf!==yf)return xf?-1:1" in s['doctor screen'],
 'future appointments sorted ascending':"return xf?xt-yt:yt-xt" in s['doctor screen'],
 'past appointments sorted newest first':"return xf?xt-yt:yt-xt" in s['doctor screen'],
 'upcoming confirmed filter exists':"filter==='upcoming'?future&&a.status==='confirmed'" in s['doctor screen'],
 'all status filter exists':"filter==='all'" in s['doctor screen'],
 'completed filter exists':"['completed','مكتملة']" in s['doctor screen'] and "a.status===filter" in s['doctor screen'],
 'beneficiary search exists':"a.beneficiary?.displayName" in s['doctor screen'],
 'patient note search exists':"a.patientNote" in s['doctor screen'],
 'appointment end time is displayed':"ينتهي: {dateText(a.endsAt)}" in s['doctor screen'],
 'patient note is displayed when available':"ملاحظة المريض:" in s['doctor screen'],
 'status actions remain restricted to confirmed past appointments':"a.status==='confirmed'&&new Date(a.startsAt).getTime()<=Date.now()" in s['doctor screen'],
 'existing message component remains connected':"<BookingMessages kind=\"doctor\" id={a.id}" in s['doctor screen'],
 'no-show label is localized':"status==='no_show'?'لم يحضر'" in s['doctor screen'],
 'documentation records verification limits':'No full NestJS build' in s['docs'],
}
failed=[k for k,v in checks.items() if not v]
print(f"V48: {len(checks)-len(failed)}/{len(checks)} checks passed")
for item in failed: print('FAIL:',item)
raise SystemExit(1 if failed else 0)
