from pathlib import Path
root=Path(__file__).parent
service=(root/'src/auth/auth.service.ts').read_text()
controller=(root/'src/auth/auth.controller.ts').read_text()
client=(root/'mobile/src/api/client.ts').read_text()
screen=(root/'mobile/src/screens/PatientProfileScreen.tsx').read_text()
doc=root/'docs/phase-v74-security-activity.md'
checks={
 'self activity endpoint exists':'myLoginSecurityActivity' in service and "me/security/activity" in controller,
 'endpoint requires authenticated session':"@Get('me/security/activity') @UseGuards(JwtAuthGuard)" in controller,
 'activity scoped to JWT subject':'myLoginSecurityActivity(@CurrentUser() user:{sub:string})' in controller and 'findById(userId)' in service,
 'email and phone hashes use HMAC':'createHmac' in service and 'user.email,user.phone' in service,
 'hashes are queried as own identifiers':'identifierHash:In(identifiers)' in service,
 'activity output omits network hashes':"select:['id','succeeded','createdAt']" in service,
 'activity is capped at 30 events':'take:30' in service,
 'mobile API method exists':'myLoginSecurityActivity' in client,
 'profile screen displays activity':'نشاط تسجيل الدخول' in screen,
 'profile screen supports refresh':'تحديث سجل النشاط' in screen,
 'activity does not expose raw IP':'ipAddress' not in service[service.find('async myLoginSecurityActivity'):],
 'phase documentation exists':doc.exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
