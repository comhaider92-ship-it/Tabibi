from pathlib import Path
root=Path(__file__).parent
checks={
 'mute entity exists':'src/messages/conversation-mute.entity.ts',
 'report entity exists':'src/messages/message-report.entity.ts',
 'migration exists':'src/database/migrations/1733200000000-MessageSafetyAndMute.ts',
 'migration creates mute table':'src/database/migrations/1733200000000-MessageSafetyAndMute.ts',
 'migration creates report table':'src/database/migrations/1733200000000-MessageSafetyAndMute.ts',
 'mute is unique per user and appointment':'src/database/migrations/1733200000000-MessageSafetyAndMute.ts',
 'mute is unique per user and facility booking':'src/database/migrations/1733200000000-MessageSafetyAndMute.ts',
 'message module registers entities':'src/messages/messages.module.ts',
 'runtime registers entities':'src/app.module.ts',
 'migration datasource registers entities':'src/database/data-source.ts',
 'mute endpoints exist':'src/messages/messages.controller.ts',
 'unread count endpoints exist':'src/messages/messages.controller.ts',
 'report endpoint exists':'src/messages/messages.controller.ts',
 'owner reports endpoint is owner-only':'src/messages/messages.controller.ts',
 'participant authorization before reporting':'src/messages/messages.service.ts',
 'duplicate reports prevented':'src/messages/messages.service.ts',
 'muted recipient receives no message notification':'src/messages/messages.service.ts',
 'new report notifies owners':'src/messages/messages.service.ts',
 'mobile supports mute and report':'mobile/src/components/BookingMessages.tsx',
 'mobile exposes unread count':'mobile/src/components/BookingMessages.tsx',
 'owner report review screen exists':'mobile/src/screens/OwnerMessageReportsScreen.tsx',
 'owner dashboard links report review':'mobile/App.tsx',
 'documentation exists':'docs/phase-v46-message-mute-reports-unread.md',
}
rules={
 'mute entity exists':lambda s:'class BookingConversationMute' in s,
 'report entity exists':lambda s:'class BookingMessageReport' in s,
 'migration exists':lambda s:'MessageSafetyAndMute1733200000000' in s,
 'migration creates mute table':lambda s:'booking_conversation_mutes' in s,
 'migration creates report table':lambda s:'booking_message_reports' in s,
 'mute is unique per user and appointment':lambda s:'uq_booking_mute_user_appointment' in s,
 'mute is unique per user and facility booking':lambda s:'uq_booking_mute_user_facility' in s,
 'message module registers entities':lambda s:'BookingConversationMute,BookingMessageReport' in s,
 'runtime registers entities':lambda s:'BookingConversationMute,BookingMessageReport' in s,
 'migration datasource registers entities':lambda s:'BookingConversationMute,BookingMessageReport' in s,
 'mute endpoints exist':lambda s:"/mute'" in s,
 'unread count endpoints exist':lambda s:'unread-count' in s,
 'report endpoint exists':lambda s:'reportMessage' in s,
 'owner reports endpoint is owner-only':lambda s:"@Roles(UserRole.OWNER)" in s and 'owner/reports' in s,
 'participant authorization before reporting':lambda s:'appointmentParticipants(message.appointmentId' in s and 'facilityParticipants(message.facilityBookingId' in s,
 'duplicate reports prevented':lambda s:'سبق أن أبلغت عن هذه الرسالة' in s,
 'muted recipient receives no message notification':lambda s:'if(!mute)await this.notifications.createAndDispatch' in s,
 'new report notifies owners':lambda s:'notifyOwners' in s and 'OWNER_MESSAGE_REPORT_PENDING' in s,
 'mobile supports mute and report':lambda s:'toggleMute' in s and 'reportBookingMessage' in s,
 'mobile exposes unread count':lambda s:'bookingUnreadCount' in s and 'غير مقروءة' in s,
 'owner report review screen exists':lambda s:'ownerMessageReports' in s and 'reviewMessageReport' in s,
 'owner dashboard links report review':lambda s:'OwnerMessageReports' in s and 'onMessageReports' in s,
 'documentation exists':lambda s:'يجب تشغيل migrations' in s,
}
missing=[]
for label,rel in checks.items():
 p=root/rel
 if not p.exists() or not rules[label](p.read_text(errors='ignore')): missing.append(label)
print(f"V46: {len(checks)-len(missing)}/{len(checks)} checks passed")
for x in missing: print('FAIL:',x)
raise SystemExit(1 if missing else 0)
