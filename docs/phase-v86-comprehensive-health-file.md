# V86 — Patient comprehensive health file

## Delivered
- Adds an authenticated `GET /api/v1/medical-records/health-file` endpoint for a patient's own consolidated medical timeline.
- Combines base medical-record entries with their structured prescription, laboratory-result, and clinical-report details.
- Includes the number of securely linked attachments without exposing upload asset identifiers, storage paths, or download URLs.
- Supports record-type filtering, ISO-8601 `from` / `to` date filters, and bounded pagination (default 20, maximum 50).
- Orders entries newest first and excludes soft-deleted records.
- Restricts the complete timeline to the patient account itself. Doctors continue to use the existing appointment-scoped and explicit-consent access paths; the owner role cannot read medical records.
- Audits each returned record as `health_file_read`; an empty result is also audited.

## API
- `GET /api/v1/medical-records/health-file`
- Optional query parameters: `recordType`, `from`, `to`, `page`, `limit`.
- `recordType` accepts the existing medical record types: `note`, `diagnosis`, `prescription`, `test_result`, `visit_summary`.

## Migration
- No database migration is required. V86 reuses the V81–V85 medical-record tables.

## Limitations / verification
- This endpoint returns a paginated timeline, not a generated PDF or a clinical interpretation of the patient's data.
- Attachments are represented by a count only; actual file retrieval remains governed by the existing secure attachment endpoints and access checks.
- Static checks do not replace NestJS compilation, PostgreSQL integration tests, or mobile UI testing.
