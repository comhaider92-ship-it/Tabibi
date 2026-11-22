# Phase V80 — Patient-data and notification privacy hardening

## Scope

This phase reduces exposure of sensitive appointment information in push notifications and owner-facing appointment details.

## Changes

1. Booking-message notifications now use a generic body. They no longer include the sender display name or a preview of the message body, reducing the chance that clinical information appears on a lock screen.
2. Appointment detail responses are role-aware. The owner retains operational appointment metadata (status, date/time, timestamps, and doctor/facility context) but does not receive the patient's clinical note, beneficiary identity, booking creator identity, or free-text status-history reason.
3. Patient and doctor appointment detail responses retain the fields they need for their own booking workflow.
4. Existing participant checks for appointment and facility conversations remain in place.

## Verification

- `scripts_verify_v80.py`: 12/12 static checks passed.
- Regression scripts V73–V79: 114/114 static checks passed.
- Total: 126/126 static checks passed.

## Limitations

These are source-level/static checks. No NestJS runtime build, database-backed integration tests, push-provider delivery test, or penetration test was run in this environment. No database schema change or migration was added.
