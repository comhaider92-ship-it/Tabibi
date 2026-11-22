# Phase V17 — In-app notifications

## Scope
- Adds a persistent per-user notification inbox for booking created, booking cancelled, appointment completed, and no-show events.
- Notification rows are written inside the same PostgreSQL transaction as the appointment mutation. A failed appointment transaction therefore cannot leave a misleading notification.
- When a booking is created, the doctor, booking user, and beneficiary receive notifications (deduplicated when the same account has multiple roles in the booking).
- Cancellation notifies the other involved accounts; completion/no-show notifies the booking user and beneficiary.
- Authenticated users can list their own notifications, request unread-only results, read the unread count, mark one notification read, or mark all their notifications read.
- Every query/update is scoped by the authenticated user ID. Notification IDs belonging to another account are not disclosed.
- Pagination is bounded to 50 records per page.

## API
- `GET /api/v1/notifications?page=1&limit=20&unreadOnly=true`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`

## Delivery boundary
This phase implements the in-app inbox and database-backed event notifications. It does not yet send SMS, email, Android push notifications, or timed pre-appointment reminders. Those require delivery-provider configuration and a background scheduler/worker, planned as a separate phase.

## Database
Run migration `1731800000000-CreateNotifications` after the prior migrations. `synchronize` remains disabled.
