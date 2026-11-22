# Phase V15 — Patient and Doctor Appointment Management

## Scope

V15 adds a single authenticated appointment-list endpoint. It does not change booking creation, slot locking, cancellation, subscriptions, payments, or notifications from earlier phases.

## Endpoint

`GET /api/v1/appointments`

Patient access:
- Returns appointments booked by the signed-in patient, including bookings made for another beneficiary.
- Also returns appointments made by another account for the signed-in patient as beneficiary.

Doctor access:
- Returns only appointments whose `doctorId` is the signed-in doctor's user ID.

Owner and other roles are not granted this list endpoint. Existing `GET /appointments/:id` authorization remains in force.

## Query parameters

- `status`: `confirmed`, `cancelled`, `completed`, or `no_show`
- `from`: ISO 8601 date/time lower bound, inclusive, applied to appointment start
- `to`: ISO 8601 date/time upper bound, inclusive, applied to appointment start
- `page`: integer >= 1; default 1
- `limit`: integer 1–50; default 20

The response contains `items` and `pagination` (`page`, `limit`, `total`, `totalPages`). Each item exposes appointment timing/status/note, a limited doctor profile, and beneficiary display name. It does not expose phone numbers, password data, OTP data, or idempotency keys.

## Privacy and authorization

The controller requires JWT authentication and role checks. The service independently rejects roles other than patient and doctor. Patient queries are scoped to `bookedByUserId` OR `beneficiaryId`; doctor queries are scoped to `doctorId`. The API selects only fields needed by the list response.

## Cancellation behavior

V15 deliberately retains the V14 cancellation behavior. The booking account or assigned doctor (and owner) may cancel a confirmed appointment; a beneficiary who did not book it cannot cancel it through this endpoint. A cancellation reopens the matching availability slot within the same transaction.

## Validation status

Static source checks and ZIP integrity checks are run by `scripts_verify_v15.py`. A TypeScript build and live PostgreSQL/API integration tests require installing dependencies and configuring a database; they must be run in the deployment/test environment before production use.
