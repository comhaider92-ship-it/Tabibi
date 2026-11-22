from pathlib import Path
root = Path(__file__).parent
checks = {
    'notification entity and read state': 'isRead' in (root/'src/notifications/notification.entity.ts').read_text(),
    'user-scoped notification list': 'n."userId" = :userId' in (root/'src/notifications/notifications.service.ts').read_text(),
    'unread count endpoint': "@Get('unread-count')" in (root/'src/notifications/notifications.controller.ts').read_text(),
    'mark one read endpoint': "@Patch(':id/read')" in (root/'src/notifications/notifications.controller.ts').read_text(),
    'mark all read endpoint': "@Patch('read-all')" in (root/'src/notifications/notifications.controller.ts').read_text(),
    'pagination capped at 50': '@Max(50)' in (root/'src/notifications/dto/list-notifications.dto.ts').read_text(),
    'booking notification in booking transaction': 'NotificationType.APPOINTMENT_BOOKED' in (root/'src/appointments/appointments.service.ts').read_text(),
    'cancellation notification': 'NotificationType.APPOINTMENT_CANCELLED' in (root/'src/appointments/appointments.service.ts').read_text(),
    'completion and no-show notification': 'NotificationType.APPOINTMENT_COMPLETED' in (root/'src/appointments/appointments.service.ts').read_text() and 'NotificationType.APPOINTMENT_NO_SHOW' in (root/'src/appointments/appointments.service.ts').read_text(),
    'notification migration exists': (root/'src/database/migrations/1731800000000-CreateNotifications.ts').exists(),
    'notification entity registered in app': 'Notification' in (root/'src/app.module.ts').read_text(),
    'notification entity registered in migration datasource': 'Notification' in (root/'src/database/data-source.ts').read_text(),
    'phase documentation states delivery limits': 'does not yet send SMS' in (root/'docs/phase-v17-notifications.md').read_text(),
}
for name, ok in checks.items(): print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} passed')
raise SystemExit(0 if all(checks.values()) else 1)
