from pathlib import Path
root=Path(__file__).parent
booking=(root/'mobile/src/screens/BookingScreen.tsx').read_text()
home=(root/'mobile/src/screens/HomeScreen.tsx').read_text()
app=(root/'mobile/App.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
module=(root/'src/app.module.ts').read_text()
source=(root/'src/database/data-source.ts').read_text()
migration=(root/'src/database/migrations/1733800000000-RemovePatientSavedBeneficiaries.ts').read_text()
checks={
 'booking asks whether booking is for self or another person': 'لمن تريد الحجز؟' in booking and 'الحجز لنفسي' in booking and 'الحجز لشخص آخر' in booking,
 'other-person name and optional phone are entered during this booking': 'بيانات الشخص الآخر' in booking and 'اسم الشخص الذي تحجز له' in booking and 'رقم هاتف الشخص (اختياري)' in booking,
 'self-booking still uses authenticated patient beneficiary ID for doctors': "beneficiaryMode==='self'?{beneficiaryId:patientId}" in booking,
 'guest booking still sends entered name and optional phone to doctor API': "{beneficiaryName:patientName.trim(),beneficiaryPhone:patientPhone.trim()||undefined}" in booking,
 'facility booking uses entered self/other patient name and optional phone': 'patientName:patientName.trim()' in booking and 'patientPhone:patientPhone.trim()||undefined' in booking,
 'no saved beneficiaries API remains in mobile client': all(x not in api for x in ['patientBeneficiaries','createPatientBeneficiary','updatePatientBeneficiary','deletePatientBeneficiary']),
 'no saved beneficiary manager screen or route remains': not (root/'mobile/src/screens/BeneficiariesScreen.tsx').exists() and 'Beneficiaries' not in app,
 'home screen no longer advertises family/beneficiary management': 'onBeneficiaries' not in home and 'أفراد العائلة والمستفيدون' not in home,
 'beneficiary backend module removed from app registration': 'BeneficiariesModule' not in module and 'PatientBeneficiary' not in module,
 'beneficiary entity removed from migration datasource': 'PatientBeneficiary' not in source,
 'forward migration removes saved beneficiary table': 'DROP TABLE IF EXISTS "patient_beneficiaries"' in migration,
 'booking history remains independent of saved contacts': 'bookDoctor' in booking and 'bookFacility' in booking,
 'no queue status or call notifications reintroduced': all(x not in booking for x in ['استدعاء التالي','تم استدعاؤك','queueStatus']),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
