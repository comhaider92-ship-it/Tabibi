# V65 — Remove patient queue notifications and queue states

This revision follows the owner's explicit decision:

- No push or in-app notification is sent when a provider verbally calls a patient or when their turn approaches.
- The app no longer models queue states such as waiting, called, in service, or skipped.
- Doctor and facility dashboards retain their normal booking lists; providers handle the physical/operational order directly with patients.
- No call-next button, queue status controls, queue API endpoints, queue response fields, or queue-specific notification type remain.
- Booking lifecycle states (confirmed, completed, no-show, cancelled, requested, rejected) and their existing notifications remain unchanged.
- Patient booking remains day-only; internal capacity slots are not exposed as promised attendance times.

## Database migration

`1733600000000-RemoveDailyQueueStates` removes the two queue columns and their indexes from `appointments` and `facility_bookings`. The earlier V64 migration is retained unchanged for migration history; the new migration reverses its schema additions safely. Roll back V65 before rolling back V64.

## Verification

Run `python scripts_verify_v65.py` and the existing V53–V64 source-contract checks. This is source-level verification only; a full Nest build, Expo bundle, APK, and live database migration test still require the configured build/runtime environment.
