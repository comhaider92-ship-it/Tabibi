# V39 — Facility profile management and owner audit trail

## Scope
- Added `PATCH /api/v1/facilities/owner/:id/profile`, restricted to authenticated OWNER accounts.
- The service verifies that the facility belongs to the current owner before applying any update.
- Facility profile changes are recorded in `owner_audit_logs`, including before/after profile snapshots.
- Profile edits preserve the current approval status and do not alter bookings, slots, or subscriptions.
- Added an owner mobile screen to list and edit the owner's facilities.
- Added an owner audit-log screen, scoped by the authenticated owner ID.
- Added both screens to owner navigation.

## Validation
- V39 static checks: 16/16.
- All existing verification scripts from V14 through V39 passed.
- TypeScript/TSX syntax transpilation: 142 files, zero syntax errors.
- No database migration required.

## Not performed
- Full NestJS build, Expo bundle, Android APK build, and live database/device tests were not run because dependencies and runtime services are not installed/configured in this workspace.
