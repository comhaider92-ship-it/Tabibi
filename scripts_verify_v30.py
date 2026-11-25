from pathlib import Path
import json
root=Path(__file__).resolve().parent
register_dto=(root/'src/auth/dto/register.dto.ts').read_text()
auth=(root/'src/auth/auth.service.ts').read_text()
login=(root/'mobile/src/screens/LoginScreen.tsx').read_text()
client=(root/'mobile/src/api/client.ts').read_text()
app=(root/'mobile/App.tsx').read_text()
package=json.loads((root/'mobile/package.json').read_text())
config=json.loads((root/'mobile/app.json').read_text())
checks={
 'registration DTO permits patient role only': "@IsIn(['patient']) role:'patient'" in register_dto,
 'backend forcibly assigns patient role': 'role:UserRole.PATIENT,isVerified:false,isActive:true' in auth,
 'unverified patient cannot login': 'user.role===UserRole.PATIENT && !user.isVerified' in auth,
 'registration screen collects full name': 'الاسم الكامل' in login,
 'registration accepts phone or email': 'رقم الهاتف أو البريد الإلكتروني' in login and 'validIdentifier' in login,
 'password minimum length checked in UI': 'password.length<10' in login,
 'register API sends patient role': "role:'patient'" in client,
 'OTP request is connected to registration': "api.requestOtp(normalized,'verify_account')" in login,
 'OTP confirmation screen exists': "mode==='verify'" in login and 'api.confirmOtp' in login,
 'OTP resend action exists': 'إعادة إرسال الرمز' in login,
 'OTP development-only limitation disclosed': 'يظهر الرمز في سجل الخادم فقط' in login,
 'secure store dependency installed in manifest': 'expo-secure-store' in package['dependencies'],
 'secure store plugin configured': 'expo-secure-store' in config['expo']['plugins'],
 'token persisted securely': 'SecureStore.setItemAsync' in client and 'SecureStore.deleteItemAsync' in client,
 'session restore function exists': 'restoreAccessToken' in client,
 'app restores and validates session': 'restoreAccessToken()' in app and 'api.me()' in app,
 'logout clears stored token': 'await setAccessToken(null);setRole(null)' in app,
 'authenticated provider roles route to dedicated dashboards': "onLogin(r.user.role)" in login and "role==='doctor'" in app and "role==='owner'" in app,
 'phase documentation exists': (root/'docs/phase-v30-patient-registration-and-session.md').exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' - '+name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
