# TABIBI V32 — Provider and facility owner mobile dashboards

## Scope
- Route authenticated doctor accounts to a dedicated doctor dashboard and authenticated owner accounts to a facility-management dashboard.
- Keep patient registration restricted to the patient role. Existing doctor and owner accounts use their assigned credentials to sign in.
- Restore persisted sessions for patient, doctor, and owner roles.
- Doctor dashboard loads the existing doctor dashboard summary and the authenticated doctor's appointment list.
- Doctors can record a confirmed appointment as completed or no-show only after its start time, using the existing backend status endpoint and its authorization/business rules.
- Owner dashboard lists only facilities owned by the signed-in owner, loads each selected facility's dashboard and bookings, and allows requested bookings to be confirmed or rejected through existing owner-only endpoints.

## Backend change
- Added `GET /api/v1/facilities/owner/mine`.
- The endpoint requires JWT authentication and the owner role.
- The service filters facilities by `ownerUserId` from the authenticated user; it does not accept an arbitrary owner ID from the client.
- No database migration is required.

## Mobile change
- Added `ProviderDashboardScreen.tsx` with doctor and owner dashboard views.
- Added API client methods for doctor summary, doctor appointment status, owner facilities, facility summary, owner bookings, and accept/reject actions.
- Updated app startup routing and login to route authenticated doctor/owner accounts to their own dashboard. Patient registration remains patient-only.

## Verification
- `scripts_verify_v32.py`: 13/13 static checks.
- All phase scripts V14–V32: 305/305 static checks passed.
- ZIP integrity checked after packaging.

## Limitations
- Static source checks do not replace TypeScript compilation, backend integration tests, database tests, or device testing.
- No `node_modules` are included; dependencies must be installed before running typecheck/build.
- No Android APK has been built or tested in this phase.
