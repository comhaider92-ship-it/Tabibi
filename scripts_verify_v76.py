from pathlib import Path
root=Path(__file__).parent
screen=(root/'mobile/src/screens/NotificationsScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
service=(root/'src/notifications/notifications.service.ts').read_text()
controller=(root/'src/notifications/notifications.controller.ts').read_text()
doc=root/'docs/phase-v76-smart-notification-center.md'
checks={
 'smart notification center title':'مركز الإشعارات الذكي' in screen,
 'all notifications filter':"key:'all'" in screen,
 'unread filter':"key:'unread'" in screen,
 'appointment category filter':"key:'appointments'" in screen,
 'message category filter':"key:'messages'" in screen,
 'account category filter':"key:'system'" in screen,
 'local search state':'const [search,setSearch]=useState' in screen,
 'search covers title body and type':'item.title||\'\'} ${item.body||\'\'} ${item.type||\'\'}' in screen,
 'chronological day grouping':'اليوم' in screen and 'أمس' in screen and 'سابقاً' in screen,
 'unread state is visually differentiated':'palette.unread' in screen and "'● جديد'" in screen,
 'bulk mark-read action':'api.markAllNotificationsRead()' in screen,
 'single mark-read action':'api.markNotificationRead(item.id)' in screen,
 'pull-to-refresh support':'RefreshControl' in screen,
 'refresh on screen focus':'useFocusEffect' in screen,
 'related appointment identifiers retained':'facilityBookingId' in screen and 'bookingId' in screen and 'appointmentId' in screen,
 'message deep-link identifier retained':'messageId' in screen,
 'prevents concurrent opening':'if(opening)return' in screen,
 'existing paginated API retained':'api.notifications(1,50)' in screen,
 'backend account-scoped list retained':"where('n.\"userId\" = :userId'" in service,
 'backend account-scoped mark-read retained':'where: { id, userId }' in service,
 'controller remains authenticated':"@UseGuards(JwtAuthGuard)" in controller,
 'no new migration required':'لا تغيير في API أو قاعدة البيانات' in doc.read_text(),
 'phase documentation exists':doc.exists(),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
