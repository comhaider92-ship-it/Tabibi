# V84 — Printable prescriptions and QR verification

## Delivered
- Authenticated, private, print-ready Arabic prescription page with clinic/doctor identity and structured medication instructions.
- Browser print action supports printing or saving the page as PDF without exposing the prescription through a public document URL.
- QR verification uses a 256-bit random bearer token; a random 256-bit verification token is stored in a dedicated non-selected column; it grants access only to a privacy-minimized validity response, not to the prescription or patient record.
- Public verification returns issuer identity, specialty, clinic, issue/expiry dates and validity only. It never returns patient identity, medications, diagnosis, or clinical content.
- Prescription print access passes the existing medical-record access policy and is audited as a prescription read.
- HTML output escapes dynamic text and is marked private/no-store.

## API
- `GET /api/v1/medical-records/prescriptions/:recordId/print` — authenticated print-ready HTML; use browser Print / Save as PDF.
- `GET /api/v1/medical-records/verify/:token` — public, privacy-minimized verification response.

## Configuration and migration
- Set `PUBLIC_API_BASE_URL` to the externally reachable API base URL, including `/api/v1`, before issuing QR codes.
- Run migration `1734500000000-AddPrescriptionVerificationTokens` before enabling the print route.
- Install dependencies with the project package manager; `qrcode` and its TypeScript declarations are now declared in package.json.

## Security notes and limitations
- The first print issues a random 256-bit token; subsequent print requests reuse it so previously printed copies remain verifiable. The token endpoint returns no patient identity or clinical contents.
- Verification intentionally exposes no patient or medication data.
- The print view is HTML designed for browser PDF export, not a server-generated signed PDF. Digital signature, pharmacy dispensing workflow, and cryptographic PDF signing are not included.
- Build and PostgreSQL integration tests require dependencies and a configured test database; static checks alone do not prove runtime correctness.
