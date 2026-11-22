# V78 — Medical file privacy hardening

## Scope
- Public image access is restricted to the currently selected doctor profile photo or facility image.
- The related doctor/facility must still be approved.
- Replaced or stale images are no longer publicly retrievable through the public endpoint.
- Public image responses use `Cache-Control: private, no-store, max-age=0` to avoid retaining medical/profile imagery in browser caches.
- Private qualification and facility documents remain behind authenticated download and owner-review authorization checks.

## Existing protections rechecked
- Upload role/category ownership checks.
- MIME allow-list and file-signature checks.
- Image/document size limits.
- Private storage directory and restrictive file permissions.
- Storage path containment check.

## Verification
Run `python scripts_verify_v78.py` for static contract checks. These checks do not replace runtime authorization tests, database-backed tests, or penetration testing.
