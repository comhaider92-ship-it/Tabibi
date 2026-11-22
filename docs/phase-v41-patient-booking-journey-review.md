# V41 – Patient booking journey review

## Scope
V41 reviews the patient booking history and cancellation journey across doctor appointments and facility/laboratory bookings.

## Changes
- Doctor appointment list responses now include a server-computed `canCancel` flag. It is true only for a patient who originally booked the appointment, while the appointment is confirmed and still in the future. A beneficiary who merely received a booking made by another account cannot be shown a cancellation action they are not authorized to perform.
- Facility booking history now enriches each booking with safe facility (`id`, `name`, `city`, `address`) and service (`id`, `name`) summaries. Related rows are loaded in batches, avoiding one query per booking.
- Facility booking history includes a server-computed `canCancel` flag only for requested/confirmed future bookings.
- The patient bookings screen displays the actual facility and service names and only renders cancellation when the server says the current account is allowed to cancel.

## Existing behavior retained
- Doctor booking is confirmed immediately after a valid available slot is atomically reserved.
- Facility/laboratory booking remains a request until the facility accepts or rejects it.
- Cancellation remains subject to backend authorization and status/time checks; UI visibility is not treated as security enforcement.
- Booking records, beneficiary details, notifications, and appointment history are retained.

## Verification limits
Static source assertions are provided in `scripts_verify_v41.py`. This phase does not claim a full NestJS build, Expo bundle, Android APK, or live database integration test.
