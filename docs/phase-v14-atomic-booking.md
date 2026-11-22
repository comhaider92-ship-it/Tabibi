# Phase V14 — Atomic appointment booking

## Scope
- A booking must match one exact doctor availability slot (same doctor, start and end).
- The slot row is locked with PostgreSQL `FOR UPDATE` inside a database transaction.
- Only open slots belonging to currently approved doctor profiles can be booked.
- The idempotency key is replay-safe only for the same caller and identical booking payload; reuse for a different payload returns HTTP 409.
- Existing PostgreSQL exclusion constraint `ex_doctor_appointment_no_overlap` remains the final guard against overlapping confirmed appointments.
- Successful booking closes the corresponding slot in the same transaction. Cancellation locks the appointment row, changes confirmed to cancelled, and reopens the exact slot in the same transaction.

## Concurrency behavior
Two requests for the same slot serialize on the slot row. The first can create the appointment; the second sees the existing confirmed overlap through the database exclusion constraint and receives HTTP 409. A retry with the same idempotency key and same payload returns the original appointment.

## Operational requirements
- PostgreSQL with `btree_gist` enabled (created by the initial appointments migration).
- Run migrations before deployment; keep `synchronize: false`.
- Client sends a fresh `Idempotency-Key` per booking attempt and reuses it only when retrying that same request.

## Manual acceptance checks
1. Book an open exact slot — expect 201 and one appointment.
2. Repeat same request with same key — expect the same appointment ID.
3. Reuse key with different doctor, beneficiary, or time — expect 409.
4. Book a closed or non-existent slot — expect 409.
5. Send two concurrent requests for one slot with different keys — exactly one succeeds; the other receives 409.
6. Cancel a confirmed appointment — expect cancelled and the exact slot reopened; a second cancellation returns 409.
7. Attempt to book an unapproved doctor's slot — expect 409.
