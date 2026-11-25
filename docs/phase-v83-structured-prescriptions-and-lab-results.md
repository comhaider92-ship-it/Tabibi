# V83 — Structured prescriptions and laboratory results

## Scope
- Adds structured medical prescriptions with up to 30 medication entries.
- Each medication stores name, strength (optional), dosage, frequency, duration, and instructions (optional).
- Adds structured laboratory results with value, unit, reference range, interpretation, laboratory, performed date, and clinical comment.
- Both document types create a linked medical-record entry and are written transactionally.
- Creation is restricted to an approved doctor and an appointment belonging to that doctor; cancelled/no-show appointments and guest beneficiaries without a patient account are rejected.
- Patient/doctor reads are guarded by ownership, the treating appointment, or a currently active explicit record-level consent. Owner access remains prohibited.
- Structured reads and writes are recorded in the medical access audit log.

## API
- `POST /api/v1/medical-records/prescriptions`
- `GET /api/v1/medical-records/prescriptions/:recordId`
- `POST /api/v1/medical-records/lab-results`
- `GET /api/v1/medical-records/lab-results/:recordId`

## Migration
Run `1734400000000-CreateStructuredPrescriptionsAndLabResults` before enabling these endpoints. `synchronize` remains disabled.

## Limitations
- This phase stores prescription medication instructions; it does not dispense medication, check drug interactions, validate clinical appropriateness, or replace a physician's judgment.
- Lab interpretation is entered by the clinician and is not generated automatically. Reference ranges depend on the laboratory, units, age, and clinical context.
- PDF rendering and cryptographic signing are not included in this backend phase; a later document-rendering phase should build on these structured records.
- Build and live PostgreSQL integration tests require installing dependencies and a configured test database; static checks do not establish runtime correctness.
