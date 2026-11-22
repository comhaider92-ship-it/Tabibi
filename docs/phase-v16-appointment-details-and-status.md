# Phase V16 — Appointment details, status workflow, and audit history

## Scope
V16 extends V15 without changing the patient-free pricing model, doctor subscriptions, or the V14 atomic booking mechanism. It adds a safe appointment detail response, a status transition endpoint, and an append-only status history.

## Appointment details
`GET /api/v1/appointments/:id` returns only to the booking account, the beneficiary, the assigned doctor, or the owner. The response includes appointment timing and status, a limited doctor profile, beneficiary display name, booking-account display name, and status history. It excludes phone numbers, password hashes, OTP data, and idempotency keys.

## Status workflow
- New bookings create an initial `confirmed` history entry in the same database transaction as the booking.
- Cancellation retains V14 permissions and atomically reopens the matching slot; the cancellation is recorded in the history in the same transaction.
- `PATCH /api/v1/appointments/:id/status` accepts `completed` or `no_show` only.
- Only the assigned doctor or owner may use this endpoint. A doctor cannot change another doctor's appointment.
- The appointment must still be `confirmed`, and its start time must have arrived.
- Every accepted transition records previous/new status, actor user ID and role, optional reason, and timestamp.
- The endpoint does not permit reopening a cancelled appointment or changing terminal states.

## Migration
Run the new TypeORM migration `1731700000000-CreateAppointmentStatusHistory` before deploying V16. It creates the history table and index, and backfills one baseline history entry for appointments that already existed at migration time.

## Daily capacity
There is no fixed daily booking cap. Doctors publish the exact available slots they choose. The existing create-slots API accepts up to 200 slots per request (a request-size safety limit, not a per-day limit); doctors can submit additional batches. Thus 100 or more appointments in a day are supported as long as the doctor publishes that many non-overlapping slots. Each exact slot can be booked once.

## Validation
Static checks cover role authorization, status allowlist, assigned-doctor ownership, confirmed-only transition, start-time gate, transactional history writes, detail privacy, and the absence of a daily appointment-count limit. A TypeScript build and live PostgreSQL/API integration tests must still be run in the deployment/test environment.
