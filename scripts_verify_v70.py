from pathlib import Path
root=Path(__file__).parent
controller=(root/'src/auth/auth.controller.ts').read_text()
users=(root/'src/users/users.service.ts').read_text()
dto=(root/'src/auth/dto/update-patient-profile.dto.ts').read_text()
mobile=(root/'mobile/src/screens/PatientProfileScreen.tsx').read_text()
home=(root/'mobile/src/screens/HomeScreen.tsx').read_text()
app=(root/'mobile/App.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
checks={
 'authenticated profile update endpoint exists': "@Patch('me/profile')" in controller and '@UseGuards(JwtAuthGuard)' in controller,
 'profile update is restricted to patient role': "user.role!=='patient'" in controller and 'ForbiddenException' in controller,
 'only display name is accepted by DTO': 'displayName:string' in dto and '@MinLength(2)' in dto and '@MaxLength(120)' in dto and 'email' not in dto and 'phone' not in dto,
 'display name update trims input': "displayName.trim()" in users,
 'profile screen loads authenticated account details': 'api.me()' in mobile and 'profile?.email' in mobile and 'profile?.phone' in mobile,
 'profile screen does not directly edit login identifiers without OTP': 'updatePatientProfile(value)' in mobile and 'confirmContactChange' in mobile,
 'profile screen explains verified contact changes': 'لن تتغير بيانات الدخول إلا بعد إدخال رمز التحقق' in mobile and 'confirmContactChange' in mobile,
 'patient home links to profile screen': 'onProfile' in home and 'ملفي الشخصي' in home,
 'patient profile route registered': 'PatientProfileScreen' in app and "name=\"PatientProfile\"" in app,
 'mobile API exposes safe profile update': "'/auth/me/profile'" in api and 'displayName:string' in api,
 'saved beneficiary management remains removed': 'BeneficiariesScreen' not in app and 'patientBeneficiaries' not in api,
 'day-only booking and no-queue policy remain intact': 'BookingsScreen' in app and 'queueStatus' not in (root/'mobile/src/screens/BookingsScreen.tsx').read_text(),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
