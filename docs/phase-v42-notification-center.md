# V42 — Notification center and in-app appointment reminders

## Delivered
- Added an Arabic mobile notification center for patient, doctor, and owner roles.
- Added mobile API methods for paginated notification listing, unread count, mark-one-read, and mark-all-read.
- Added notification center navigation from each role's main screen.
- Notification rows show title, body, timestamp, read state, and a route to the related booking list/dashboard when linked to an appointment.
- Fixed notification persistence so `appointmentId` is copied from notification data instead of always being stored as null.
- Added distinct in-app notification types for 24-hour and 2-hour appointment reminders.
- Updated the reminder worker to persist reminders in the in-app notification center even when Firebase push is not configured or the user has no registered push device. Firebase push remains an optional additional delivery channel.
- Existing user-scoped read/list APIs and facility booking notifications are retained.

## Important behavior
- Notification records and read actions are scoped to the authenticated account.
- `remindersEnabled=false` suppresses reminder creation; disabling push does not suppress in-app reminders.
- A reminder is considered delivered to the in-app center even if optional push delivery fails. The worker does not create duplicate reminder notifications on retries.
- Firebase push delivery still requires valid Firebase service configuration and registered device tokens.

## Validation
- Run `python3 scripts_verify_v42.py` for V42 static checks.
- Run all `scripts_verify_v*.py` scripts for the cumulative static suite.
- TypeScript/TSX syntax transpilation is checked separately with the globally installed TypeScript transpiler.
- No new database migration is required; notification types are stored as varchar values and the existing notification/reminder tables are reused.
- This phase has not been validated by a full NestJS build, Expo bundle, Android APK build, or live database/device test.
