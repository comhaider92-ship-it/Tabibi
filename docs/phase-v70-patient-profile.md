# V70 — Patient profile management

## Scope
- Adds a patient-only authenticated profile update endpoint: `PATCH /api/v1/auth/me/profile`.
- Allows changing the account display name only (2–120 characters, trimmed).
- Patient profile screen shows current phone/email as read-only and displays verification status.
- Phone/email login identifiers are deliberately not editable in this phase. A future secure change flow must verify the new destination with OTP before replacing the identifier.
- Doctors and owner cannot use this patient profile endpoint; their existing professional/owner workflows remain unchanged.

## Preserved decisions
- No saved family members or saved beneficiaries.
- Booking remains self or another person with details entered for each booking; other-person details remain in the booking record only.
- Day-only booking semantics remain unchanged; no queue states or call-next notifications are introduced.

## Verification
- `scripts_verify_v70.py` checks the endpoint, role restriction, DTO constraints, mobile screen/navigation, and preserved exclusions.
- This is source-contract verification, not a full NestJS typecheck/build, Expo bundle, APK/AAB build, live database test, or OTP delivery test.
