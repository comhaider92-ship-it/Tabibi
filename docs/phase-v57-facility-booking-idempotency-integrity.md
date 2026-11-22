# V57 — Facility booking request idempotency integrity

## Issue found
The facility booking endpoint returned an existing booking when the idempotency key, authenticated booker, facility, service, and slot matched. It did not compare the beneficiary/patient name, optional phone, or patient note. Reusing a key for the same slot but changed patient details could silently return the earlier booking, misleading the patient and facility.

## Change
- Replay acceptance now requires the authenticated booker, facility, service, slot, patient name, normalized optional phone, and normalized optional note to match the original request.
- A reused key with any different booking detail returns HTTP conflict and tells the client to retry with a fresh key.
- Existing slot row locking, availability checks, approved-facility check, active-service check, requested status, and booker ownership are unchanged.
- Mobile continues to send the chosen facility, service, slot, patient name, optional phone, and idempotency header.

## Verification
- `scripts_verify_v57.py`: 18 source-contract checks.
- V56 focused profile-to-doctor booking integration checks rerun.
- V53 core, V54 Android configuration, and V55 API configuration checks rerun.
- TypeScript/TSX syntax transpilation is performed over source files.

## Limits
These are source-level checks, not live API tests. No PostgreSQL transaction, simultaneous duplicate request, mobile device flow, full NestJS build, Expo bundle, APK, or external security test was run in this environment. A concurrent identical idempotency-key race remains a runtime integration test requirement; database uniqueness is still enforced by the existing unique index.
