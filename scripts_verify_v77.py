from pathlib import Path
root=Path(__file__).parent
otp=(root/'src/auth/otp.service.ts').read_text()
guard=(root/'src/auth/jwt-auth.guard.ts').read_text()
service=(root/'src/auth/auth.service.ts').read_text()
entity=(root/'src/auth/auth-session.entity.ts').read_text()
checks={
 'OTP destination normalization exists':'normalizeTarget(value:string)' in otp and 'toLowerCase()' in otp,
 'OTP request uses normalized destination':'const target=this.normalizeTarget(identifier)' in otp and 'target,purpose,' in otp,
 'OTP delivery uses normalized destination':'deliver(target,code' in otp,
 'OTP resend limit is destination scoped':'userId:user.id,purpose,target,createdAt:MoreThan' in otp,
 'OTP confirmation is destination scoped':'userId:user.id,purpose,target,consumedAt:null' in otp,
 'OTP still enforces per-code attempt cap':'row.attempts>=this.maxAttempts' in otp,
 'JWT guard requires jti':'!payload?.jti' in guard,
 'JWT claim version checked against account':'(payload.tokenVersion??0)!==(user.tokenVersion??0)' in guard,
 'persisted session version checked against account':'session.tokenVersion!==(user.tokenVersion??0)' in guard,
 'session owner and revocation checked':'where:{jti:payload.jti,userId:user.id,revokedAt:IsNull()}' in guard,
 'session expiry checked':'session.expiresAt<=new Date()' in guard,
 'session entity stores version':'tokenVersion: number' in entity,
 'login creates persisted session':'this.sessions.save' in service,
 'phase documentation exists':(root/'docs/phase-v77-security-hardening.md').exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
