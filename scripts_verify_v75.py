from pathlib import Path
root=Path(__file__).parent
service=(root/'src/auth/auth.service.ts').read_text()
controller=(root/'src/auth/auth.controller.ts').read_text()
guard=(root/'src/auth/jwt-auth.guard.ts').read_text()
app_ui=(root/'mobile/App.tsx').read_text()
security_screen=(root/'mobile/src/screens/AccountSecurityScreen.tsx').read_text()
entity=(root/'src/auth/auth-session.entity.ts').read_text()
migration=(root/'src/database/migrations/1734100000000-CreateAuthSessions.ts').read_text()
module=(root/'src/auth/auth.module.ts').read_text()
app=(root/'src/app.module.ts').read_text()
data=(root/'src/database/data-source.ts').read_text()
client=(root/'mobile/src/api/client.ts').read_text()
screen=(root/'mobile/src/screens/PatientProfileScreen.tsx').read_text()
doc=root/'docs/phase-v75-device-session-management.md'
checks={
 'session entity exists':(root/'src/auth/auth-session.entity.ts').exists(),
 'session migration exists':(root/'src/database/migrations/1734100000000-CreateAuthSessions.ts').exists(),
 'session entity registered in auth module':'AuthSession' in module,
 'session entity registered in app datasource':'AuthSession' in app,
 'session entity registered in migration datasource':'AuthSession' in data,
 'login creates random jti':'randomUUID()' in service and 'jwtid:jti' in service,
 'login stores server-side session':'this.sessions.save' in service,
 'session stores token version':'tokenVersion:user.tokenVersion||0' in service and 'tokenVersion: number' in entity,
 'guard requires jti':'!payload?.jti' in guard,
 'guard verifies session ownership and revocation':'where:{jti:payload.jti,userId:user.id,revokedAt:IsNull()}' in guard,
 'guard rejects expired sessions':'session.expiresAt<=new Date()' in guard,
 'list is scoped to authenticated user':'listMySessions(userId:string,currentJti:string)' in service and 'where:{userId,revokedAt:IsNull(),expiresAt:MoreThan(now)}' in service,
 'list filters token-version-invalidated sessions':'row.tokenVersion===(user.tokenVersion||0)' in service,
 'single-session revocation is owner scoped':'where:{id:sessionId,userId,revokedAt:IsNull()}' in service,
 'controller exposes authenticated session list':"@Get('me/sessions') @UseGuards(JwtAuthGuard)" in controller,
 'controller exposes authenticated single revoke':"@Post('me/sessions/:id/revoke') @UseGuards(JwtAuthGuard)" in controller,
 'mobile API exposes list and revoke':'mySessions:' in client and 'revokeSession:' in client,
 'patient profile shows active sessions':'الأجهزة والجلسات النشطة' in screen and 'إنهاء هذه الجلسة' in screen,
 'doctor and owner have security navigation':'AccountSecurity' in app_ui and "onPress={()=>navigation.navigate('AccountSecurity' as never)}" in app_ui,
 'shared security screen supports session revocation':'api.mySessions()' in security_screen and 'api.revokeSession(item.id)' in security_screen,
 'migration adds unique jti index':'uq_auth_sessions_jti' in migration,
 'migration cascades on user deletion':'ON DELETE CASCADE' in migration,
 'documentation exists':doc.exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
