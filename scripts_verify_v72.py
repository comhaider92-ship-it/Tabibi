from pathlib import Path
root=Path(__file__).parent
entity=(root/'src/users/user.entity.ts').read_text()
users=(root/'src/users/users.service.ts').read_text()
guard=(root/'src/auth/jwt-auth.guard.ts').read_text()
auth=(root/'src/auth/auth.service.ts').read_text()
controller=(root/'src/auth/auth.controller.ts').read_text()
dto=(root/'src/auth/dto/change-password.dto.ts').read_text()
mobile=(root/'mobile/src/screens/PatientProfileScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
app=(root/'mobile/App.tsx').read_text()
migration=(root/'src/database/migrations/1733900000000-AddUserTokenVersion.ts').read_text()
checks={
 'user has persistent token version': "@Column({type:'int',default:0}) tokenVersion:number" in entity,
 'migration adds token version safely': 'ADD COLUMN IF NOT EXISTS' in migration and 'DEFAULT 0' in migration,
 'login token includes token version': 'tokenVersion:user.tokenVersion||0' in auth,
 'guard rejects stale token versions': "(payload.tokenVersion??0)!==(user.tokenVersion??0)" in guard,
 'password DTO enforces length and character classes': '@MinLength(10)' in dto and 'A-Za-z' in dto and '0-9' in dto,
 'password change requires current password verification': 'bcrypt.compare(currentPassword,user.passwordHash)' in users,
 'password change increments token version': 'tokenVersion:(user.tokenVersion||0)+1' in users,
 'password change endpoint authenticated': "@Post('me/password/change') @UseGuards(JwtAuthGuard)" in controller,
 'wrong current password is rejected': 'كلمة المرور الحالية غير صحيحة' in controller,
 'revoke all sessions endpoint authenticated': "@Post('me/sessions/revoke-all') @UseGuards(JwtAuthGuard)" in controller,
 'session revocation increments version': "increment({id},'tokenVersion',1)" in users,
 'password reset also revokes existing sessions': 'await this.repo.increment({id},\'tokenVersion\',1)' in users,
 'mobile API exposes both security actions': 'changePassword:' in api and 'revokeAllSessions:' in api,
 'patient UI collects current and confirmed new password': 'currentPassword' in mobile and 'confirmPassword' in mobile,
 'patient UI logs out after security change': 'onLogout?.()' in mobile and 'onLogout={logout}' in app,
 'beneficiary saved-list feature remains removed': 'BeneficiariesScreen' not in app and 'patientBeneficiaries' not in api,
 'day-only no-queue booking policy remains': 'queueStatus' not in (root/'mobile/src/screens/BookingsScreen.tsx').read_text(),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
