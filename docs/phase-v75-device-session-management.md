# V75 — Device and active session management

## Scope
- Every successful login creates a server-side session record with a cryptographically random JWT `jti`.
- JWTs are bound to the session record and the user's `tokenVersion`; requests without a valid session record are rejected.
- Authenticated users can list only their own active sessions and revoke one selected session.
- The session list identifies the current session and shows a privacy-preserving generic device label, creation time, last activity, and expiry.
- User-agent text is stored with a strict 200-character limit and is never returned to the client. The raw IP is not stored; only the keyed digest already used by login security controls is retained.
- Sessions invalidated by password changes, OTP password resets, or global sign-out are filtered by `tokenVersion` and cannot authenticate.
- Session history is limited to 50 visible active sessions; expired and revoked sessions are not presented as active.

## API
- `GET /auth/me/sessions` — current user's active sessions.
- `POST /auth/me/sessions/:id/revoke` — revoke one session owned by the current user.
- Existing `POST /auth/me/sessions/revoke-all` and password-change flows remain in place.

## Database
- Migration `1734100000000-CreateAuthSessions` creates `auth_sessions`, a unique `jti` index, user/session lookup index, and cascade deletion when a user is removed.
- Run migrations during deployment; no live database migration was executed as part of this source-package phase.

## Security notes
- Session identifiers are random JWT IDs, not user-supplied device IDs.
- Ownership is enforced in the database query (`id` plus authenticated `userId`); a user cannot revoke another user's session.
- The device label is intentionally coarse and does not claim a precise hardware identity.
- Existing access tokens issued before V75 lack a registered `jti` and will require a fresh login after deployment.

## Verification limits
Static regression and TypeScript/TSX syntax transpilation are not a full NestJS build, database integration test, mobile bundle, APK build, or penetration test.
