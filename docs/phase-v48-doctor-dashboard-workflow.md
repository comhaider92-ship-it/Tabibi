# V48 — Doctor dashboard and appointment workflow

## Scope
- The doctor mobile client requests the first page with a larger, validated page size of 50 rather than relying on the API's default 20.
- Doctor appointment results are ordered client-side with future appointments first (ascending by start time), followed by past appointments (descending by start time).
- Added appointment filters: upcoming confirmed appointments, all, confirmed, completed, no-show, and cancelled.
- Added local search across beneficiary display name and patient note.
- Appointment cards now show start and end time, status, and patient note when provided.
- Existing server-side authorization remains authoritative for completing or marking no-show; actions are only displayed for confirmed appointments once their start time has arrived.
- Existing doctor schedule, professional profile, subscription, and booking-message flows are preserved.

## API
- `api.appointments(page, limit, status?)` now accepts pagination and optional status filters.
- The doctor dashboard uses `api.appointments(1, 50)`; the backend already validates `limit <= 50`.
- No backend schema or database migration changes.

## Verification limits
- Static source checks and TypeScript/TSX syntax transpilation are performed for this delivery.
- No full NestJS build, Expo bundle, APK build, live API, or real database test is claimed because project dependencies/runtime services are not installed in this workspace.
