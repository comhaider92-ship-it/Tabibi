# V59 — Facility booking decisions and rejection reasons

## Scope
This phase tightens the existing facility-owner decision flow (`requested` -> `confirmed`/`rejected`). Doctor appointments remain instantly confirmed under the established product rule; doctors continue to manage completion/no-show and cancellation through their existing routes. No new doctor approval queue is introduced.

## Changes
- Facility owner decisions continue to lock the booking row in a database transaction and verify that the booking belongs to a facility owned by the acting owner.
- A decision is accepted only while the booking is still `requested`; repeated or conflicting decisions are rejected.
- Rejecting a facility booking now requires a non-empty, trimmed reason (up to 500 characters). The reason is stored as `statusNote` and included in the rejection notification.
- The provider dashboard presents a rejection-reason field for each pending request, blocks rejection when the field is blank, passes the reason to the API, and displays the saved reason on rejected bookings.
- Confirmation remains available without a rejection reason. Existing notification types and safe slot-release behavior are retained.

## Verification
Run `python scripts_verify_v59.py` from the project root. This source-contract regression script has 15 checks. V58, V57, V56, V55, V54, and V53 targeted checks also pass. TypeScript/TSX syntax transpilation reports 166 files and zero syntax errors.

A run of all 46 historical verification scripts reports 43 passing and three failures:
- V26: an old source-text assertion expects the facility slot-closure expression to appear inline twice. The current implementation centralizes that behavior in `releaseFacilitySlotIfUnused`, and the focused V58 cancellation/slot-restoration checks pass (18/18).
- V31: stale OTP delivery expectation.
- V35: stale subscription lifecycle expectations.
These are reported as failures, not counted as passes.

## Not performed
No live PostgreSQL concurrency/integration test, full NestJS build, Expo bundle, APK build, push/SMS provider delivery test, or external security test was performed in this environment.
