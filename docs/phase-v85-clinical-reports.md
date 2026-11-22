# V85 — Clinical reports and private printable export

## Delivered
- Structured clinical reports with report kinds: visit, diagnosis, follow-up, imaging, and medical summary.
- Reports contain a summary, up to 20 titled sections, recommendations, follow-up plan, and optional next-review date.
- A report and its corresponding medical-record row are created in one database transaction.
- Only an approved doctor with a valid, non-cancelled/non-no-show appointment can create a report for the appointment's registered patient.
- Patient and doctor report reads reuse the existing structured medical-record access policy. Owners are denied by that policy.
- Reads and creation are written to the patient's medical access audit log.
- Authenticated print-ready Arabic HTML includes issuer/clinic identity, report sections, and a QR verification token. Browser Print / Save as PDF is supported; this is not a server-generated or cryptographically signed PDF.
- Public QR verification reveals issuer, clinic, document type, and issue time only. It never returns patient identity, summary, sections, diagnosis, recommendations, or other clinical contents.
- Dynamic HTML values are escaped and print responses are marked private/no-store.

## API
- `POST /api/v1/medical-records/reports`
- `GET /api/v1/medical-records/reports/:recordId`
- `GET /api/v1/medical-records/reports/:recordId/print`
- `GET /api/v1/medical-records/verify/report/:token` (public, privacy-minimized)

## Migration
- Run `1734600000000-CreateMedicalClinicalReports` before enabling V85.
- TypeORM synchronization remains disabled.

## Limitations / verification
- The print endpoint returns HTML for browser PDF export, not a server-generated PDF or digitally signed document.
- QR verification proves that a report token exists and the issuer remains approved; it does not disclose clinical contents or patient identity.
- Static checks do not replace NestJS compilation, PostgreSQL migration execution, authorization integration tests, or penetration testing. Those require installed dependencies and a configured test database.
