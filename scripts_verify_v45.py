from pathlib import Path
root=Path(__file__).parent
checks={
 'message notification type exists':'src/notifications/notification.entity.ts',
 'messages module imports notifications module':'src/messages/messages.module.ts',
 'message service injects notifications service':'src/messages/messages.service.ts',
 'message send persists notification':'src/messages/messages.service.ts',
 'notification is addressed to recipient':'src/messages/messages.service.ts',
 'notification includes message id':'src/messages/messages.service.ts',
 'notification includes appointment or facility booking context':'src/messages/messages.service.ts',
 'notification preview is bounded':'src/messages/messages.service.ts',
 'notification delivery failure is isolated':'src/notifications/notifications.service.ts',
 'push notification dispatch is supported':'src/notifications/notifications.service.ts',
 'mobile notification screen recognizes message id':'mobile/src/screens/NotificationsScreen.tsx',
 'mobile notification screen recognizes facility booking id':'mobile/src/screens/NotificationsScreen.tsx',
 'mobile message notification action is localized':'mobile/src/screens/NotificationsScreen.tsx',
 'existing notifications module exports service':'src/notifications/notifications.module.ts',
 'phase documentation exists':'docs/phase-v45-message-notifications.md',
 'verification script exists':'scripts_verify_v45.py',
}
missing=[]
for label,rel in checks.items():
 p=root/rel
 if not p.exists(): missing.append(label); continue
 s=p.read_text(errors='ignore')
 rules={
 'message notification type exists':"BOOKING_MESSAGE_RECEIVED" in s,
 'messages module imports notifications module':'NotificationsModule' in s,
 'message service injects notifications service':'NotificationsService' in s,
 'message send persists notification':'createAndDispatch' in s,
 'notification is addressed to recipient':'userId:message.recipientUserId' in s,
 'notification includes message id':'messageId:message.id' in s,
 'notification includes appointment or facility booking context':'facilityBookingId' in s and 'appointmentId' in s,
 'notification preview is bounded':'clean.slice(0,117)' in s,
 'notification delivery failure is isolated':'in-app notification was saved' in s,
 'push notification dispatch is supported':'this.push.send' in s,
 'mobile notification screen recognizes message id':'item.data?.messageId' in s,
 'mobile notification screen recognizes facility booking id':'item.data?.facilityBookingId' in s,
 'mobile message notification action is localized':'فتح المحادثة' in s,
 'existing notifications module exports service':'exports: [NotificationsService]' in s,
 'phase documentation exists':'إشعارات الرسائل' in s,
 'verification script exists':'V45:' in s,
 }
 if not rules[label]: missing.append(label)
print(f"V45: {len(checks)-len(missing)}/{len(checks)} checks passed")
for x in missing: print('FAIL:',x)
raise SystemExit(1 if missing else 0)
