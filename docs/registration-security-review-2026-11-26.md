# Registration and Role Access Review — 2026-11-26

## Findings confirmed from source review
- The current public `POST /auth/register` flow creates patient accounts only; `RegisterDto` restricts role to `patient`.
- Owner account bootstrap is configured through server environment settings and does not promote an existing non-owner account.
- Login returns the persisted user role, and the mobile app routes into role-specific views based on that response.
- Doctor profile create/update and submission endpoints require JWT and the doctor role. Owner pending/review endpoints require JWT and owner role.
- Public doctor directory and public doctor detail access expose approved profiles only.
- A separate doctor registration/application workflow is not currently implemented in the reviewed files. It should be added without accepting owner role from public input.

## Release-critical work
1. Add a dedicated doctor application registration DTO and endpoint; do not broaden patient registration DTO.
2. Prevent duplicate email/phone and ensure a newly registered doctor is verified and profile status is pending/draft—not approved.
3. Ensure doctor profile creation/application submission is linked to the authenticated doctor identity, and owner review remains owner-only.
4. Add API tests: patient token against doctor endpoints; patient and doctor tokens against owner routes; unauthenticated owner-route attempts; registration attempts with role=owner; doctor directory visibility before and after approval.
5. Verify login and role switching UI transitions, including session/token clearing, without requiring the app process to be terminated.

## Evidence limits
This is a static source review, not a runtime test or penetration test. No security claims should be treated as validated until API tests and build checks pass.
