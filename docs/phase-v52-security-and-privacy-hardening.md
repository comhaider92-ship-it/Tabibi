# V52 – Security and privacy hardening

## Changes
- Fixed a missing `ParseUUIDPipe` import in the uploads controller, which prevented the controller from compiling.
- Added `X-Content-Type-Options: nosniff` to public image and authenticated download responses.
- Public approved images receive a short public cache policy; private downloads are explicitly `private, no-store`.
- Doctor upload requests cannot attach an arbitrary facility ID. Facility image/document uploads continue to require ownership of the specified facility.
- Upload DTO rejects empty filenames and bounds the base64 payload before decoding; service-side decoded-size and file-signature checks remain in place.
- Application startup now refuses an absent, short, or unchanged example JWT secret. Configure a unique random secret of at least 32 characters before deployment.

## Security boundaries reviewed
- JWT guard reloads the account and active status from the database for every protected request.
- Role guard checks current database role; owner-scoped facility and audit operations pass the authenticated owner ID into service methods.
- Private upload downloads require ownership or owner-only access to a currently pending review asset. Public image reads remain limited to approved doctor/facility profiles.
- Booking message access remains limited to actual booking participants; owner moderation remains report-scoped rather than unrestricted conversation browsing.

## Deployment notes
- Set a unique `JWT_SECRET` (at least 32 random characters); do not use the sample value.
- Keep `UPLOADS_DIRECTORY` outside any static/public web root, restrict filesystem permissions, and back it up securely.
- Enforce HTTPS at the reverse proxy. Keep database credentials and provider secrets out of source control.
- This phase does not add a production-grade distributed rate limiter, WAF, antivirus scanning, database TLS policy, or penetration test. These remain pre-launch tasks.

## Verification limits
Static source checks and TypeScript/TSX syntax transpilation are not a substitute for a full Nest build, dependency installation, live database authorization tests, or an external security assessment. No APK or production deployment was performed in this phase.
