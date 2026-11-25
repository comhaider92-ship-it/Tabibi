from pathlib import Path
import sys
root=Path(__file__).parent
screen=(root/'mobile/src/screens/AccountSecurityScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
service=(root/'src/auth/auth.service.ts').read_text()
checks=[]
def check(name,ok): checks.append((name,bool(ok)))
check('account security screen calls existing login activity endpoint','api.myLoginSecurityActivity()' in screen and "'/auth/me/security/activity'" in api)
check('successful and failed login events are distinguished',"event.result==='success'?'تسجيل دخول ناجح':'محاولة دخول غير ناجحة'" in screen)
check('login activity timestamp uses Baghdad timezone',"timeZone:'Asia/Baghdad'" in screen)
check('security activity is presented with user guidance','إذا لاحظت محاولة ناجحة لا تعرفها' in screen)
check('session revocation remains available','api.revokeSession(item.id)' in screen)
check('sessions and login activity load independently','Promise.allSettled([api.mySessions(),api.myLoginSecurityActivity()])' in screen)
check('backend limits login history to latest 30 events','take:30' in service)
check('login history response excludes raw identifiers and IP addresses',"return rows.map(row=>({id:row.id,result:row.succeeded?'success':'failed',createdAt:row.createdAt}))" in service)
failed=[name for name,ok in checks if not ok]
for name,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
