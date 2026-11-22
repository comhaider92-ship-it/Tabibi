# Phase V81 — Patient-owned medical records and access audit

## Scope
- Introduces private medical record entries with patient ownership, author identity/role, optional appointment linkage, soft deletion, and timestamps.
- Patient accounts can list their own records, create personal entries, and soft-delete only their own patient-authored entries.
- Doctors must provide an appointment ID and can access only records linked to that exact appointment, after verifying that the appointment belongs to that doctor.
- Doctors can create and update only records they authored. For a third-party beneficiary, the beneficiary must have a registered account; unregistered free-text beneficiaries are rejected for medical-record attribution.
- Owner accounts are denied medical-record access and cannot create, update, or delete records.
- Read/list/create/update/delete actions are recorded in a separate access log. Patients can inspect a limited access-history view that omits actor IDs and record contents.
- Records are soft-deleted; access-log rows are retained.

## API
- `GET /api/v1/medical-records` — patient: all own records; doctor: requires `appointmentId` and returns only records linked to that appointment.
- `GET /api/v1/medical-records/access-history` — patient only.
- `POST /api/v1/medical-records` — patient personal entry or doctor entry tied to an appointment.
- `PATCH /api/v1/medical-records/:id` — record author only.
- `DELETE /api/v1/medical-records/:id` — patient may soft-delete only their own patient-authored entry.

## Database
Migration: `1734200000000-CreatePatientMedicalRecords.ts`.
Run the migration before enabling these endpoints. No automatic schema synchronization is enabled.

## Limitations
- This phase establishes text-based medical records and access logging. It does not yet add attachments, patient consent delegation, export/PDF, or a clinical audit dashboard.
- The implementation has not been runtime-tested against PostgreSQL in this environment. Static contract checks are not a substitute for integration tests.
