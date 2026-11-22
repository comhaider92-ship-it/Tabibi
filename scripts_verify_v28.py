from pathlib import Path
root=Path(__file__).parent
checks={
 'Expo app manifest':(root/'mobile/app.json').exists(),
 'React Native app entry':(root/'mobile/App.tsx').exists(),
 'API client uses configured base URL':'EXPO_PUBLIC_API_URL' in (root/'mobile/src/api/client.ts').read_text(),
 'Patient login calls backend':'/auth/login' in (root/'mobile/src/api/client.ts').read_text(),
 'Medical categories loaded':'/medical-directory/categories' in (root/'mobile/src/api/client.ts').read_text(),
 'Doctor name search wired':'/doctors${queryString' in (root/'mobile/src/api/client.ts').read_text(),
 'Facility service search wired':'/facilities${queryString' in (root/'mobile/src/api/client.ts').read_text(),
 'Doctor public slots endpoint wired':'/doctors/${id}/available-slots' in (root/'mobile/src/api/client.ts').read_text(),
 'Doctor appointment booking endpoint wired':'/appointments' in (root/'mobile/src/api/client.ts').read_text(),
 'Facility booking endpoint wired':'/facilities/bookings' in (root/'mobile/src/api/client.ts').read_text(),
 'Idempotency key supplied':'Idempotency-Key' in (root/'mobile/src/api/client.ts').read_text(),
 'Bookings list combines both booking types':'Promise.all([api.appointments(),api.myFacilityBookings()])' in (root/'mobile/src/screens/BookingsScreen.tsx').read_text(),
 'Booking for another person field':'اسم المريض' in (root/'mobile/src/screens/BookingScreen.tsx').read_text(),
 'Doctor self-booking uses authenticated patient ID':'beneficiaryId:patientId' in (root/'mobile/src/screens/BookingScreen.tsx').read_text(),
 'Setup documentation present':(root/'mobile/docs/phase-v28-mobile-patient-foundation.md').exists(),
 'No migration added':not any('V28' in p.name or 'v28' in p.name for p in (root/'src/database/migrations').glob('*')) if (root/'src/database/migrations').exists() else True,
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'{sum(checks.values())}/{len(checks)} checks passed')
if not all(checks.values()): raise SystemExit(1)
