# V40 — Doctor account details and immediate session revocation

## Owner doctor account details
- Added `GET /api/v1/owner/users/:id/details`, restricted to OWNER and UUID-validated.
- Returns safe account metadata, doctor profile/review details, current subscription status, and the latest 20 subscription records.
- Does not return password hashes or authentication secrets.
- Expanded the owner user-management screen so doctor details can be opened/hidden inline.
- Shows account creation date, profile approval status, subscription expiry, and subscription history.

## Account deactivation security
- `JwtAuthGuard` now loads the current account from the database for every protected request.
- Inactive or deleted accounts are rejected immediately, including requests made with a previously issued JWT.
- The guard uses the current database role rather than trusting a stale role claim from the token.
- Login already rejected inactive accounts; this closes the remaining active-session gap.
- Deactivation preserves account, profile, appointment, and subscription records.

## Verification
- `scripts_verify_v40.py` contains static checks for the new endpoint, owner authorization, safe response shape, UI, and guard behavior.
- No database migration is required.
- Runtime integration, database-backed authorization tests, full NestJS build, Expo bundle, and Android APK build still require a configured environment and dependencies.
