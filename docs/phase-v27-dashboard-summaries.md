# Phase V27 — Dashboard summary APIs

## Scope
V27 adds read-only dashboard summary endpoints for the existing doctor and medical-facility owner portals. It does not create Android/iOS screens or alter booking, subscription, scheduling, or exceptional-closure workflows.

## Endpoints

### Doctor
`GET /api/v1/dashboard/doctor?from=<ISO-8601>&to=<ISO-8601>`

- Requires an authenticated `DOCTOR` account.
- Defaults to now through seven days if dates are omitted.
- Returns doctor identity/profile status, appointment counts by confirmed/cancelled/completed/no-show, open/closed slot counts, active exceptional closures, and up to 10 upcoming confirmed appointments.

### Facility owner
`GET /api/v1/dashboard/facilities/:facilityId?from=<ISO-8601>&to=<ISO-8601>`

- Requires an authenticated `OWNER` account and verifies that the facility belongs to that owner.
- Returns facility identity/status, booking counts by requested/confirmed/cancelled/completed/rejected, available/closed slot counts, active exceptional closures, active services with their independent durations, and up to 15 upcoming requested/confirmed bookings.

## Shared behavior
- Date ranges must be valid, end after start, and no longer than 93 days.
- Default timezone label is `Asia/Baghdad`; timestamps are returned as ISO values.
- These are read-only aggregate endpoints. They never change booking status or reopen/close slots.
- Facility service schedules remain independent; no fixed consultation duration is introduced for doctors.
- Existing V26 exceptional closure behavior is unchanged: confirmed bookings are not automatically cancelled.

## Deployment
No database migration is needed. Deploy the updated backend. Existing V26 migration requirements remain unchanged.

## UI status
These APIs supply data for dashboard screens. Actual mobile/web dashboard screens have not yet been implemented in this backend-only repository.
