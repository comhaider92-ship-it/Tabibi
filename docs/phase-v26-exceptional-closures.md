# Phase V26 – Exceptional closures for doctors and facilities

## Purpose
Allow a doctor, laboratory, or diagnostic center to disable an otherwise-working day or part of a day without changing the recurring weekly schedule or official weekly holiday.

## Doctor endpoints
- `POST /api/v1/doctors/me/schedule-exceptions` – create a future closure using `startsAt`, `endsAt`, optional `timezone`, and optional `reason`.
- `GET /api/v1/doctors/me/schedule-exceptions` – list active closures.
- `PATCH /api/v1/doctors/me/schedule-exceptions/:id/restore` – restore a closure early.

## Facility endpoints (owner only)
- `POST /api/v1/facilities/owner/:id/schedule-exceptions` – create a facility-wide closure, or a service-specific closure by including `serviceId`.
- `GET /api/v1/facilities/owner/:id/schedule-exceptions` – list active closures.
- `PATCH /api/v1/facilities/owner/:id/schedule-exceptions/:exceptionId/restore` – restore early.

## Behavior and safety
- Date-time values must be ISO-8601 timestamps with an explicit offset; the default timezone label is `Asia/Baghdad`.
- A closure must be in the future and end after it starts. Overlapping active closures for the same doctor or overlapping facility/service scope are rejected.
- Open doctor slots and available facility slots overlapping the closure are closed. Facility slots have a distinct `closed` status, separate from cancelled.
- New slots cannot be created within an active closure. A doctor cannot manually reopen a slot covered by a closure.
- Requested/confirmed facility bookings and confirmed doctor appointments are not cancelled or altered. The API returns the affected booking/appointment references and a warning so the owner can contact patients and resolve them deliberately.
- Restoring a closure reopens only the exact slots that were open before that closure and are not still covered by another active closure.
- The backend API and persistence are implemented; client UI, push notifications to affected patients, and live database integration tests remain separate work.

## Migration
Run `1732600000000-CreateScheduleExceptions` after the V25 migrations.
