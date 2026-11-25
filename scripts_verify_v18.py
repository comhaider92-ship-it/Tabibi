from pathlib import Path
root = Path(__file__).parent
checks = {
    'device token entity and user index': 'ix_notification_device_user_active' in (root/'src/notifications/device-token.entity.ts').read_text(),
    'unique device token': 'uq_notification_device_token' in (root/'src/notifications/device-token.entity.ts').read_text(),
    'authenticated token registration endpoint': "@Post('devices')" in (root/'src/notifications/notifications.controller.ts').read_text(),
    'device removal endpoint': "@Delete('devices/:id')" in (root/'src/notifications/notifications.controller.ts').read_text(),
    'user notification preferences': "@Post('preferences')" in (root/'src/notifications/notifications.controller.ts').read_text(),
    'Firebase admin integration': "getMessaging().sendEachForMulticast" in (root/'src/notifications/push/firebase-push.service.ts').read_text(),
    'Firebase disabled safely without credentials': 'FCM is not configured' in (root/'src/notifications/push/firebase-push.service.ts').read_text(),
    'durable reminder table and indexes': 'appointment_reminders' in (root/'src/database/migrations/1731900000000-CreatePushAndAppointmentReminders.ts').read_text(),
    '24h and 2h reminder generation': "kind: '24h'" in (root/'src/appointments/appointments.service.ts').read_text() and "kind: '2h'" in (root/'src/appointments/appointments.service.ts').read_text(),
    'reminders for booker and beneficiary': 'saved.bookedByUserId, saved.beneficiaryId' in (root/'src/appointments/appointments.service.ts').read_text(),
    'reminders cancelled with appointment': 'ReminderStatus.SKIPPED' in (root/'src/appointments/appointments.service.ts').read_text(),
    'scheduled worker': '@Cron(CronExpression.EVERY_MINUTE)' in (root/'src/notifications/reminder-worker.service.ts').read_text(),
    'multi-instance skip locked claim': ".setOnLocked('skip_locked')" in (root/'src/notifications/reminder-worker.service.ts').read_text(),
    'stale worker claims can recover after restart': "interval '10 minutes'" in (root/'src/notifications/reminder-worker.service.ts').read_text(),
    'FCM payloads are chunked to provider limit': 'offset += 500' in (root/'src/notifications/push/firebase-push.service.ts').read_text(),
    'retry and invalid token handling': 'messaging/registration-token-not-registered' in (root/'src/notifications/reminder-worker.service.ts').read_text() and 'attempts >= 5' in (root/'src/notifications/reminder-worker.service.ts').read_text(),
    'new entities registered in app and migration datasource': 'AppointmentReminder' in (root/'src/app.module.ts').read_text() and 'AppointmentReminder' in (root/'src/database/data-source.ts').read_text(),
    'Firebase and scheduler dependencies': 'firebase-admin' in (root/'package.json').read_text() and '@nestjs/schedule' in (root/'package.json').read_text(),
}
for name, ok in checks.items(): print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} passed')
raise SystemExit(0 if all(checks.values()) else 1)
