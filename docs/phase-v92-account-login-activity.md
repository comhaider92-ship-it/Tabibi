# V92 — Account login activity

The account security screen now displays the latest login attempts associated with the signed-in account, alongside active sessions.

- Uses the existing authenticated `GET /api/v1/auth/me/security/activity` endpoint.
- Distinguishes successful and failed attempts.
- Displays timestamps in the Asia/Baghdad timezone.
- Keeps session revocation available.
- Loads session data and login activity independently so one failing endpoint does not hide the other.
- The backend returns only event ID, result, and timestamp; it does not expose IP addresses, email addresses, phone numbers, or raw account identifiers.

This phase reuses the existing `login_security_events` table and API. No database migration is required.

Run `python scripts_verify_v92.py` for focused static checks. A real-device test and full TypeScript/build validation remain required before release.
