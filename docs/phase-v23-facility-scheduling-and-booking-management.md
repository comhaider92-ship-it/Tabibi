# Phase V23 – Facility schedules and booking management

## Scope
- A facility owner can create individual available appointment slots for an active service at a facility they own.
- Slot duration must match the service's configured expected duration. Slots must be future-dated and no longer than eight hours.
- Patients can view available slots for an approved facility over a maximum 31-day range, optionally filtered by service.
- A patient books a concrete slot (`slotId`) rather than submitting an arbitrary time. Slot locking and the booking write occur in one database transaction to prevent two patients from taking the same slot.
- The facility owner can list bookings for their own facility and confirm or reject pending requests.
- Rejected and patient-cancelled future bookings release their slot. Patients can cancel only their own future requested/confirmed booking.
- Rejection notes are stored separately from the patient's note.

## Endpoints
- `POST /api/v1/facilities/owner/:id/slots` (owner): `{ "serviceId": "uuid", "startsAt": "ISO-8601", "endsAt": "ISO-8601" }`
- `GET /api/v1/facilities/:id/slots?from=ISO-8601&to=ISO-8601&serviceId=uuid` (public)
- `GET /api/v1/facilities/owner/:id/bookings?status=requested` (owner)
- `PATCH /api/v1/facilities/owner/bookings/:bookingId/status` (owner): `{ "status": "confirmed" | "rejected", "reason": "optional" }`
- `PATCH /api/v1/facilities/bookings/:id/cancel` (patient)
- `POST /api/v1/facilities/bookings` (patient): requires `facilityId`, `serviceId`, `slotId`, `patientName`; send `Idempotency-Key` header.
- `GET /api/v1/facilities/bookings/mine` (patient)

## Migration
Run `npm run migration:run` to apply `1732300000000-AddFacilityAvailabilityAndManagement` after the earlier migrations. Existing bookings are preserved; `slotId` is nullable for historical rows.

## Important limitations
- This phase creates individual appointment slots, not recurring weekly opening hours or bulk slot generation.
- Facility booking requests remain `requested` until the facility owner confirms or rejects them. No instant confirmation is implied.
- Push notifications for facility booking decisions are not wired in this phase.
- Static source checks do not replace a TypeScript build or PostgreSQL integration tests.
