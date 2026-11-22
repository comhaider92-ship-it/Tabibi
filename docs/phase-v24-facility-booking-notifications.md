# Phase V24 — Facility booking notifications

V24 connects diagnostic-center booking events to the existing notification inbox and optional Firebase Cloud Messaging (FCM) delivery.

## Events

- `facility_booking_requested`: sent to the facility owner after a patient successfully creates a booking request.
- `facility_booking_confirmed`: sent to the patient after the owner confirms the request.
- `facility_booking_rejected`: sent to the patient after the owner rejects the request. The optional rejection reason is included in the message and notification data.
- `facility_booking_cancelled`: sent to the facility owner when a patient cancels a future request or confirmed booking.

## Delivery behavior

1. The booking/status transaction commits first. Notification delivery is then attempted, so a push-provider outage cannot roll back or make a committed booking appear to have failed.
2. The notification is persisted in the existing `notifications` table and appears through the existing authenticated inbox endpoints: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/:id/read`, and `PATCH /api/v1/notifications/read-all`.
3. If the user has push enabled, active device tokens registered through `POST /api/v1/notifications/devices` are sent through Firebase Cloud Messaging.
4. If Firebase is not configured, or a user has disabled push, the in-app notification remains available. Invalid/unregistered device tokens are deactivated.
5. A booking decision can only be made while the request is `requested`; repeated decisions are rejected by the existing state guard, preventing duplicate decision notifications.
6. The V24 migration narrows the unique slot-booking index to active `requested`/`confirmed` bookings, allowing a slot released by rejection or cancellation to be booked by another patient.

## Configuration

Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the Firebase service-account JSON (as a single environment variable), install the project's dependencies, register each mobile device token, and ensure the mobile app subscribes to/display notifications. Without Firebase credentials, in-app delivery continues to work.

## Important integration boundary

The backend now creates and dispatches these notifications. The mobile client must still register its FCM token, request operating-system notification permission, handle foreground/background notification taps, and refresh the in-app inbox/unread count. A real-device FCM delivery test requires valid Firebase credentials and a registered device; those credentials are not included in this source archive.

## Verification

Run migration `1732400000000-UpdateFacilityBookingSlotUniqueness` after V23, then run `python scripts_verify_v24.py` for the phase's static source checks. These are not a substitute for a TypeScript build, database integration test, or a real-device push test.
