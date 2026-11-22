# V56 — Patient-to-doctor booking identifier integration

## Issue found
The public doctor directory and public doctor detail endpoint expose the doctor's **profile UUID** as `id`. Doctor availability slots and appointment records are internally keyed by the doctor's **user UUID**. The mobile patient flow was passing the profile UUID to both the availability lookup and the appointment creation endpoint. This identifier mismatch could make the selected doctor's slots appear empty and/or cause a booking to fail even though the profile was visible in the public directory.

There was also a route mismatch: the mobile client called `/doctors/:id/available-slots`, while the existing scheduling controller exposed `/scheduling/:doctorId/available-slots`.

## Changes
- Added `GET /doctors/:profileId/available-slots`. It accepts the public profile UUID, resolves the approved profile to its internal doctor user UUID on the server, and delegates to the existing scheduling service. The account UUID is not returned to the patient.
- Exported `SchedulingService` from `SchedulingModule` and imported that module into `DoctorsModule` for reuse of the existing availability rules.
- Added `doctorProfileId` as an optional appointment DTO field. The controller routes profile-based requests through `AppointmentsService.createFromProfile`.
- The resolver accepts only an approved doctor profile, rejects conflicting profile/account identifiers, and then calls the existing atomic booking path with the resolved internal doctor UUID.
- Updated the mobile booking request to send `doctorProfileId` rather than treating the profile UUID as the doctor account UUID.
- Preserved the existing slot lock, approved-profile validation, active-subscription validation, idempotency, beneficiary and booker rules.

## Verification
- `scripts_verify_v56.py`: source-contract checks for route alignment, server-side identifier resolution, privacy boundary, and preservation of atomic booking safeguards.
- TypeScript/TSX syntax transpilation is run across the repository.
- Historical regression scripts are rerun and reported individually; known stale historical expectations are not represented as passes.

## Not performed
No live NestJS process, PostgreSQL database, authenticated device session, end-to-end booking, Expo bundle, Android APK, or external security test is available in this source-only environment. The checks in this phase do not replace those runtime tests.

## V56 execution results
- V56 focused integration contracts: **17/17 passed**.
- V53 core regression contracts after adapting the controller assertion to the new profile resolver: **30/30 passed**.
- V54 Android configuration contracts: **14/14 passed**.
- V55 API configuration contracts: **12/12 passed**.
- TypeScript/TSX syntax transpilation: **166 files, 0 syntax errors**.
- Full historical suite: **41 of 43 scripts passed**. Two known legacy scripts remain failing on outdated expectations: V31 (17/18, legacy OTP delivery assumption) and V35 (20/23, previous subscription lifecycle assumptions). They are reported as failures, not counted as passing.
- Full NestJS typecheck/build and Expo typecheck/bundle remain unverified because dependencies are not installed in this workspace.
