# V73 — Login protection and security events

## Scope
- Normalize login identifiers before deriving a keyed SHA-256 digest; raw identifiers and IP addresses are not persisted in the security-event table.
- Track successful and failed login attempts with timestamp, identifier digest, and IP digest.
- Apply a temporary 15-minute cooldown after 5 failed attempts for one normalized identifier, or 30 failed attempts from one IP address, within the rolling 15-minute window.
- Return the same generic invalid-credentials response for unknown users, inactive users, and wrong passwords. Rate-limit responses do not reveal whether an account exists.
- Successful authentication is recorded without storing passwords, password hashes, OTP values, JWTs, or raw contact details.
- Add an owner-only endpoint to inspect the latest 50 login event outcomes and timestamps. It deliberately omits identifiers and IP addresses.
- OTP request/confirmation and password-reset flows are not rate-limited by this login-specific counter.

## API
- `GET /api/v1/auth/owner/security/login-events` — owner role only; requires a valid JWT.

## Database
Run the new TypeORM migration `1734000000000-AddLoginSecurityEvents` during deployment. `synchronize` remains disabled.

## Operational notes / limitations
- The 15-minute threshold is temporary, not a permanent account lock. A shared IP can reach the IP threshold; production deployments should tune this threshold for clinic/hospital networks and use a trusted proxy configuration only when the deployment topology is known.
- The IP value uses Express `req.ip`; do not enable proxy trust broadly without configuring trusted proxy hops.
- Event rows are append-only in this phase. Establish a production retention/cleanup policy before operating at scale.
- This is application-level protection, not a WAF, distributed edge rate limiter, CAPTCHA, or penetration test. Multi-instance deployments should consider atomic counters/shared rate-limit storage to prevent race-condition bypass.
