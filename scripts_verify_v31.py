from pathlib import Path
root=Path(__file__).resolve().parent
login=(root/'mobile/src/screens/LoginScreen.tsx').read_text()
client=(root/'mobile/src/api/client.ts').read_text()
bookings=(root/'mobile/src/screens/BookingsScreen.tsx').read_text()
service=(root/'src/auth/otp.service.ts').read_text()
delivery=(root/'src/auth/otp-delivery.service.ts').read_text()
checks={
 'forgot password entry is visible from login':'نسيت كلمة المرور؟' in login,
 'reset request uses reset_password OTP purpose':"api.requestOtp(normalized,'reset_password')" in login,
 'reset confirmation sends new password':"api.confirmOtp(normalized,'reset_password',code,newPassword)" in login,
 'reset UI enforces six digit OTP':'/^[0-9]{6}$/.test(code)' in login,
 'reset UI enforces ten character password':'newPassword.length<10' in login,
 'resend uses the active OTP purpose':"mode==='verify'?'verify_account':'reset_password'" in login,
 'server enforces reset password length':'newPassword.length<10' in service,
 'server limits OTP attempts':'maxAttempts=5' in service,
 'server sets five minute OTP lifetime':'ttl=5*60*1000' in service,
 'production OTP delivery is not falsely claimed':'مزود إرسال OTP غير مربوط بعد' in delivery,
 'appointment cancellation API is connected':'/appointments/${id}/cancel' in client,
 'facility cancellation API is connected':'/facilities/bookings/${id}/cancel' in client,
 'appointments response pagination wrapper handled':'a?.items||[]' in bookings,
 'guest beneficiary name shown':'x.beneficiary?.displayName||x.beneficiaryName||x.patientName' in bookings,
 'guest beneficiary phone shown':'x.beneficiary?.phone||x.beneficiaryPhone||x.patientPhone' in bookings,
 'future appointments only offered for cancellation':'const future=new Date(x.startsAt)>new Date()' in bookings,
 'facility request and confirmed cancellation states handled':"['requested','confirmed'].includes(x.status)" in bookings,
 'phase documentation exists':(root/'docs/phase-v31-password-recovery-and-bookings.md').exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' - '+name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
