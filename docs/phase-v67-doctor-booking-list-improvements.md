# Phase V67 — Doctor booking list improvements

## Scope
- Doctor dashboard now loads every page of the doctor's appointment history instead of silently limiting the visible list to the first 50 records.
- The daily summary is calculated from the complete loaded appointment set using Baghdad calendar-day boundaries.
- Added a dedicated "today's bookings" filter.
- Search now matches beneficiary name, beneficiary phone, booking-account display name, and patient note.
- The displayed result count follows the active filter and search query.

## Preserved behavior
- Patients still choose a day only; no exact attendance hour is shown.
- Internal slot capacity and booking semantics are unchanged.
- Existing booking statuses, day-based completion/no-show rules, booking details, and authorized messaging remain unchanged.
- No queue states, call-next actions, or queue-related patient notifications are introduced.

## Verification
Run `python scripts_verify_v67.py` and all historical `scripts_verify_v*.py` checks. TypeScript/TSX syntax transpilation is separate from a full NestJS build or Expo/Android build.
