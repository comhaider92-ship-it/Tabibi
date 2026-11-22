# V60 — Notification routing and unread badges

## Scope
This phase closes a data-contract gap between facility booking notifications and the mobile notification center, and improves visibility of unread notifications for all signed-in roles.

## Changes
- Facility booking request, confirmation, rejection, and cancellation notifications now include the canonical `facilityBookingId` field. The existing `bookingId` key remains for backward compatibility.
- The mobile notification center recognizes both the canonical and legacy booking identifiers when deciding whether an item can open a related booking.
- The notification center reloads its list and unread total whenever it receives navigation focus, so returning to it refreshes the current state.
- A shared header control displays the signed-in account's unread notification count on patient, doctor, and owner home screens. It refreshes on initial mount and navigation focus, caps the visible label at `99+`, and remains usable if the count endpoint is temporarily unavailable.
- Existing account-scoped API endpoints continue to enforce that each user sees and marks only their own notifications.

## Verification
Run `python scripts_verify_v60.py` from the project root. The focused source-contract suite contains 18 checks. Run the earlier targeted suites for V53–V59 as regression coverage.

## Not performed
No live push-provider delivery, PostgreSQL integration test, full NestJS build, Expo bundle, APK build, or real-device navigation test was performed. The unread badge refreshes on navigation focus; it is not a background real-time socket stream.
