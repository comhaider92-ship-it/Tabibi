# V72 — Account password and session security

- Authenticated patients can change their password after supplying the current password.
- New passwords require at least 10 characters and at least one ASCII letter and digit.
- Password changes invalidate all existing JWT sessions by incrementing `users.tokenVersion`.
- Password-reset OTP updates also invalidate prior sessions.
- Authenticated users can explicitly revoke all sessions; the current device is logged out too.
- JWT guard compares the token's `tokenVersion` with the current database value. Legacy tokens without the claim are accepted only while the account version remains zero.
- Mobile profile screen provides password change and global sign-out actions, then returns the user to login.
- Migration `1733900000000-AddUserTokenVersion` adds a non-null integer with default zero.

## Validation boundaries

Source-contract regression tests and TypeScript/TSX transpilation are not a substitute for a full NestJS build, Expo bundle, database migration execution, or penetration test. OTP/email/SMS delivery remains dependent on configured external providers.
