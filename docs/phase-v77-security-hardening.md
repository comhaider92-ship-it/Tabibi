# V77 — Security hardening: OTP destination binding and session consistency

## Changes
- OTP request normalizes the destination (lowercase email, trimmed phone) and stores that exact destination.
- OTP resend throttling is scoped to account, purpose, and destination, so a code sent to one verified contact cannot throttle a different contact on the same account.
- OTP confirmation now requires the submitted identifier to match the destination stored with the OTP. This prevents a code delivered to one contact method from being redeemed through another contact method attached to the same account.
- JWT guard now checks the persisted session's `tokenVersion` against the current account version, in addition to checking the JWT claim, session owner, revocation state, and expiry.
- No database schema change or migration is required.

## Security rationale
The server-side session row is authoritative for the session version as well as the JWT claim. OTPs are bound to the exact destination that received them, not merely to the user account.

## Validation boundaries
Static source-contract tests verify the intended controls are present. Dependencies are not installed in this exported workspace, so a full NestJS build, mobile bundle, database-backed concurrency test, live OTP delivery test, and penetration test have not been run. Existing OTP attempt limits remain per OTP record; distributed rate limiting and atomic OTP-attempt updates remain production hardening items.
