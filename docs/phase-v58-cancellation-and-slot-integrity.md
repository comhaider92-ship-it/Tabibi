# V58 — Booking cancellation and slot integrity

## Scope
Reviewed patient cancellation for facility bookings and doctor appointments, plus facility rejection, focusing on authorization, timing, and safe restoration of availability.

## Changes
- Facility cancellation remains restricted to the authenticated original booker (`bookedByUserId`), including when the booking was made for a relative or guest beneficiary.
- Facility cancellation remains limited to requested/confirmed future bookings.
- Facility rejection and patient cancellation now share a slot-release routine. It locks the availability slot row, checks for any other requested/confirmed booking attached to that slot, and does not reopen the slot while another active booking exists.
- Facility slot restoration respects active schedule exceptions, including service-specific and facility-wide closures.
- Doctor appointment cancellation now rejects attempts after the appointment has started. Existing authorization remains: original booker, assigned doctor, or owner.
- Doctor availability restoration checks for another confirmed appointment on the exact interval before reopening the slot, and still respects schedule exceptions.
- Existing cancellation notifications, appointment history, and reminder suppression are retained.

## Verification
- `scripts_verify_v58.py`: 18 source-contract checks.
- Previous phase checks V53–V57 are retained in the project; they should be rerun with their exact scripts.
- TypeScript transpilation is a syntax check only. It is not a full NestJS typecheck/build.

## Runtime limitations
No PostgreSQL instance, live API, concurrent transaction test, Expo device test, APK build, or external security test was run in this environment. The locking and restoration behavior requires integration testing against PostgreSQL before production release.
