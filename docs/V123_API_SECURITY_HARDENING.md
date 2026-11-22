# V123 — API security response hardening

## Changes
- Disable the Express X-Powered-By header.
- Add X-Content-Type-Options: nosniff and X-Frame-Options: DENY.
- Set a strict referrer policy and disable browser camera, microphone, and geolocation capabilities for API responses.
- Prevent caching of API responses that may contain account, booking, or medical information.
- Emit HSTS only in production, where the application already requires an HTTPS public API URL.
- Preserve the existing 14 MiB JSON body limit required for base64 uploads and the existing global DTO validation.

## Validation
The branch workflow runs the NestJS build, migration structural checks, build-readiness checks, and source assertions for the security headers. This is defense-in-depth; it does not replace dependency remediation, authorization tests, TLS/proxy configuration review, or penetration testing.
