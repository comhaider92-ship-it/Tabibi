from pathlib import Path
root=Path(__file__).parent
screen=(root/'mobile/src/screens/ProviderDashboardScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
doc=(root/'docs/phase-v49-owner-operations-dashboard.md').read_text()
checks={
 'owner dashboard has clear owner-level title':'لوحة المالك وإدارة المنشآت' in screen,
 'pending doctor queue uses owner API':'api.pendingDoctors()' in screen,
 'pending facility queue uses owner API':'api.pendingFacilities()' in screen,
 'pending subscription queue uses owner summary': 'api.ownerSummary()' in screen,
 'message report queue uses owner API':'api.ownerMessageReports()' in screen,
 'message report queue counts pending only':"r.status==='pending'" in screen,
 'unread owner notifications are counted':'api.unreadNotifications()' in screen,
 'doctor count is rendered':'ملفات أطباء بانتظار المراجعة: {queue.doctors}' in screen,
 'facility count is rendered':'منشآت بانتظار الاعتماد: {queue.facilities}' in screen,
 'first subscription approval count is rendered':'اشتراكات أول مرة بانتظار الموافقة: {queue.subscriptions}' in screen,
 'renewal payment verification count is rendered':'تجديدات بانتظار تأكيد الدفعة: {queue.renewals}' in screen,
 'report count is rendered':'بلاغات رسائل تحتاج مراجعة: {queue.reports}' in screen,
 'notification count is rendered':'إشعارات غير مقروءة: {queue.notifications}' in screen,
 'review navigation remains available':'onPress={onReview}' in screen,
 'subscription navigation remains available':'onPress={onManageSubscriptions}' in screen,
 'report navigation remains available':'onPress={onMessageReports}' in screen,
 'queue endpoint methods exist in client':all(x in api for x in ['pendingDoctors:','pendingFacilities:','ownerSubscriptions:','ownerMessageReports:','unreadNotifications:']),
 'per-source failures do not block queue':'api.pendingDoctors().catch(()=>[])' in screen and 'api.ownerMessageReports().catch(()=>[])' in screen,
 'refresh action is clearly labeled':'تحديث البيانات وقائمة المتابعة' in screen,
 'documentation states no migration':'no new backend route or database migration' in doc,
 'documentation records build limitations':'No full NestJS build' in doc,
}
failed=[k for k,v in checks.items() if not v]
print(f"V49: {len(checks)-len(failed)}/{len(checks)} checks passed")
for item in failed: print('FAIL:',item)
raise SystemExit(1 if failed else 0)
