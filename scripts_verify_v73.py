from pathlib import Path
root=Path(__file__).parent
checks={
 'login attempt entity exists':(root/'src/auth/login-security-event.entity.ts').exists(),
 'login security migration exists':(root/'src/database/migrations/1734000000000-AddLoginSecurityEvents.ts').exists(),
 'login security repository registered': 'LoginSecurityEvent' in (root/'src/auth/auth.module.ts').read_text(),
 'migration datasource registered': 'LoginSecurityEvent' in (root/'src/database/data-source.ts').read_text(),
 'application entity registered': 'LoginSecurityEvent' in (root/'src/app.module.ts').read_text(),
 'identifier hashing is keyed': 'createHmac' in (root/'src/auth/auth.service.ts').read_text(),
 'temporary identifier threshold': 'identifierFailures>=5' in (root/'src/auth/auth.service.ts').read_text(),
 'temporary IP threshold': 'ipFailures>=30' in (root/'src/auth/auth.service.ts').read_text(),
 '15-minute rolling window': '15*60*1000' in (root/'src/auth/auth.service.ts').read_text(),
 'generic invalid credentials': "بيانات الدخول غير صحيحة" in (root/'src/auth/auth.service.ts').read_text(),
 'owner-only audit endpoint': "owner/security/login-events" in (root/'src/auth/auth.controller.ts').read_text() and '@Roles(UserRole.OWNER)' in (root/'src/auth/auth.controller.ts').read_text(),
 'login request passes client IP': 'req.ip' in (root/'src/auth/auth.controller.ts').read_text(),
 'no password data in event entity': 'password' not in (root/'src/auth/login-security-event.entity.ts').read_text().lower(),
 'phase documentation exists': (root/'docs/phase-v73-login-security.md').exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
