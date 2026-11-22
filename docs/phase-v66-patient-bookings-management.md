# V66 — Patient booking list management

This phase improves the patient's own booking list without changing the day-only booking policy or provider workflows.

## Changes
- Added patient-side filters: all bookings, upcoming/today, past, and cancelled/rejected.
- Added a search field covering provider name, beneficiary name, and doctor specialty or facility service.
- Upcoming bookings are sorted chronologically; past bookings are sorted newest day first.
- Day classification uses the Asia/Baghdad calendar day and treats the current day as upcoming unless the booking is already completed or marked no-show.
- Preserved the server-provided cancellation permission and existing booking messaging permission checks.
- Kept patient-facing booking dates day-only; no attendance hour is shown.
- No queue statuses, call-next actions, or queue notifications are introduced.

## Verification
Run `python scripts_verify_v66.py` and all existing `scripts_verify_v53.py` through `scripts_verify_v65.py` checks. Source-contract and syntax checks do not replace a full Nest build, Expo bundle, APK, or live integration tests.
