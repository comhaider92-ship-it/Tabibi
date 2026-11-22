# V44 — Booking-scoped communication

## Scope
Adds private, booking-specific text communication between the account that created a booking and the relevant provider:
- Doctor appointment: patient booker ↔ assigned doctor.
- Facility booking: patient booker ↔ facility owner.

## Backend
- New `booking_messages` entity and migration `1733100000000-CreateBookingMessages`.
- `GET/POST /api/v1/messages/appointments/:id` for patient/doctor participants.
- `GET/POST /api/v1/messages/facility-bookings/:id` for patient/owner participants.
- The service verifies booking ownership/doctor assignment/facility ownership on every request. A beneficiary account that did not create the booking cannot read or send messages, matching the booking-owner permission model.
- Message body is trimmed and limited to 1,000 characters. Messages are ordered oldest-first, limited to the latest 200, and unread messages addressed to the current user are marked read when loaded.
- Owner accounts cannot access doctor appointment conversations; unrelated owners cannot access facility conversations.

## Mobile
- Added a reusable booking-message modal.
- Patient booking cards show messaging only when the server returns `canMessage=true`.
- Doctor appointment cards and owner facility-booking cards include the corresponding conversation.

## Privacy and operational notes
- Messages are visible only to the two booking participants; there is no owner-wide message inbox or moderation backdoor.
- This phase is text-only. Do not send emergency requests, payment credentials, or sensitive medical records through the chat.
- Push notifications for new messages, attachments, deletion, reporting/blocking, retention policy, and moderation tooling are not included.
- Migration must be run before using the feature.
