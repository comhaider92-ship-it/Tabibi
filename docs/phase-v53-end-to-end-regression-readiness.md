# V53 – End-to-end regression readiness

## Purpose
Consolidate high-risk workflow checks before live integration testing. This phase adds repeatable regression contracts and an operator test matrix; it does not claim live execution against PostgreSQL, SMS, Firebase, or Android.

## Regression contracts covered
- Patient identity is taken from the authenticated JWT, never from a client-supplied booker id.
- Doctor booking requires a future open slot, approved doctor profile, active/unexpired subscription, transaction lock, and idempotency consistency.
- Patient and doctor booking lists are scoped to their own participation; only the booking creator receives patient cancellation permission.
- A guest beneficiary cannot impersonate the account that booked for them in booking messaging.
- Facility messaging checks facility ownership; reports are limited to incoming messages and duplicate reports are rejected.
- Conversation mute suppresses notification dispatch but does not delete the message; unread counts are recipient/conversation scoped.
- First-time subscription approval is distinct from renewal-payment confirmation; a renewal extends from a still-active expiry.
- Facility service deactivation is blocked by future requested/confirmed bookings.
- Private uploads require authenticated download; public image reads use the approval gate; random storage names and JWT fail-closed configuration remain enforced.
- Owner audit reads are owner-scoped and owner accounts cannot be deactivated through user management.

## Manual live test matrix (must run in staging)
1. Patient A books for self: appointment appears in A's list; Patient B cannot access it.
2. Patient A books for guest sibling: A can view/cancel when allowed; guest cannot message as A or cancel as A.
3. Doctor A sees only A's appointments; Doctor B cannot read or update A's appointment.
4. Two simultaneous requests target one doctor slot: only one booking succeeds; replay with same idempotency key and same payload returns same booking; changed payload conflicts.
5. First subscription: owner approval required. Renewal: no new eligibility approval; owner only confirms receipt. Renewal while active starts at prior expiry, not immediately.
6. Facility owner A cannot edit, disable, view private files, or message bookings for facility B.
7. Muted conversation: message is saved and appears in chat, but recipient receives no message notification; unmuting restores notification dispatch.
8. Only a recipient participant can report a message; duplicate report is rejected; owner can see reported content but no general conversation-browsing route is introduced.
9. Private document: unrelated patient and unrelated doctor receive forbidden/not found; authorized doctor/owner review can access only permitted assets.
10. Expired subscription: doctor remains discoverable if profile approved, but new appointment creation is rejected.
11. Facility service with future requested/confirmed bookings cannot be disabled; existing bookings are not silently cancelled.
12. Run OTP and push tests with real configured providers and verify actual delivery and failure behavior.

## Results and limits
- `scripts_verify_v53.py`: 30/30 source-contract checks passed.
- Existing V14–V52 suite: 37 scripts passed (654 individual checks); two legacy scripts remain stale/failing: V31 expects a prior OTP behavior, V35 expects the old subscription approval lifecycle. These are recorded rather than silently counted as passing.
- TypeScript/TSX syntax transpilation is run separately; this is not a Nest build or Expo bundle.
- No live PostgreSQL authorization/concurrency tests, real provider delivery tests, APK build, device tests, or external penetration test have been performed.
