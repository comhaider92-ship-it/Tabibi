from pathlib import Path
root=Path(__file__).parent
checks={
 'search normalizes paginated doctor results':'mobile/src/screens/SearchScreen.tsx',
 'search synchronizes changed search kind and query':'mobile/src/screens/SearchScreen.tsx',
 'search supports city filter':'mobile/src/screens/SearchScreen.tsx',
 'search calls doctor and facility APIs with city':'mobile/src/screens/SearchScreen.tsx',
 'search reports result count':'mobile/src/screens/SearchScreen.tsx',
 'doctor API declares paginated response':'mobile/src/api/client.ts',
 'detail loads full public doctor profile':'mobile/src/screens/DetailScreen.tsx',
 'detail loads facility services':'mobile/src/screens/DetailScreen.tsx',
 'detail displays doctor experience and ratings':'mobile/src/screens/DetailScreen.tsx',
 'detail displays facility service prices in IQD':'mobile/src/screens/DetailScreen.tsx',
 'booking date window covers 30 days':'mobile/src/screens/BookingScreen.tsx',
 'booking allows selecting beneficiary':'mobile/src/screens/BookingScreen.tsx',
 'booking displays empty slot state':'mobile/src/screens/BookingScreen.tsx',
 'booking refreshes doctor slots':'mobile/src/screens/BookingScreen.tsx',
 'booking confirms summary before submit':'mobile/src/screens/BookingScreen.tsx',
 'facility booking sends patient identity fields':'mobile/src/screens/BookingScreen.tsx',
 'doctor booking uses account id for self':'mobile/src/screens/BookingScreen.tsx',
 'documentation exists':'docs/phase-v47-patient-journey-polish.md',
}
rules={
 'search normalizes paginated doctor results':lambda s:'Array.isArray(value?.items)' in s,
 'search synchronizes changed search kind and query':lambda s:'useEffect(()=>{setQ(initial);setCity(\'\')' in s,
 'search supports city filter':lambda s:'placeholder="المحافظة (اختياري)"' in s,
 'search calls doctor and facility APIs with city':lambda s:"api.doctors(searchText,cityName.trim()||undefined):await api.facilities(searchText,cityName.trim()||undefined)" in s,
 'search reports result count':lambda s:'عدد النتائج المعروضة' in s,
 'doctor API declares paginated response':lambda s:'request<{items:any[];pagination?:any}>' in s,
 'detail loads full public doctor profile':lambda s:'api.doctor(item.id)' in s,
 'detail loads facility services':lambda s:'api.facilityServices(item.id)' in s,
 'detail displays doctor experience and ratings':lambda s:'experienceYears' in s and 'ratingAverage' in s and 'ratingCount' in s,
 'detail displays facility service prices in IQD':lambda s:'priceIqd' in s and 'د.ع' in s,
 'booking date window covers 30 days':lambda s:'30*86400000' in s,
 'booking allows selecting beneficiary':lambda s:"setBeneficiaryMode('other')" in s and 'beneficiaryName:patientName.trim()' in s,
 'booking displays empty slot state':lambda s:'لا توجد مواعيد متاحة' in s,
 'booking refreshes doctor slots':lambda s:'تحديث المواعيد' in s and 'onPress={loadDoctorSlots}' in s,
 'booking confirms summary before submit':lambda s:'تأكيد بيانات الحجز' in s and 'onPress:submitBooking' in s,
 'facility booking sends patient identity fields':lambda s:'patientName:patientName.trim()' in s and 'patientPhone:patientPhone.trim()' in s,
 'doctor booking uses account id for self':lambda s:'beneficiaryId:patientId' in s,
 'documentation exists':lambda s:'30 days' in s and 'Verification limits' in s,
}
missing=[]
for label,rel in checks.items():
 p=root/rel
 if not p.exists() or not rules[label](p.read_text(errors='ignore')):missing.append(label)
print(f"V47: {len(checks)-len(missing)}/{len(checks)} checks passed")
for x in missing:print('FAIL:',x)
raise SystemExit(1 if missing else 0)
