# V94 — Production readiness baseline

This phase begins the operational-readiness pass against the V93 source archive.

## Changes

- Register `MedicalClinicalReport` in the standalone TypeORM migration data source, matching the Nest application entity registration. This keeps CLI metadata consistent when the clinical-report table is queried by repositories.
- Remove the hard-coded fallback JWT signing/HMAC secret from authentication. The application already rejects startup unless a unique `JWT_SECRET` of at least 32 characters is configured; authentication now uses that validated value and fails closed if configuration is absent.
- Add `GET /api/v1/health/live` as a process liveness probe.
- Add `GET /api/v1/health/ready` as a database readiness probe. It executes `SELECT 1`, returns a generic 503 when the database cannot be reached, and does not expose connection details.

## Deployment checks still required

- Install dependencies and run the TypeScript production build.
- Run all 33 TypeORM migrations against a disposable PostgreSQL database, then verify the migration table and key tables.
- Exercise liveness/readiness against a running server with PostgreSQL both available and unavailable.
- Configure real production secrets, private upload storage, mail/SMS, Firebase, HTTPS reverse proxy, backups, and restore testing before public launch.
- Build and install an Android preview APK only after a reachable HTTPS API URL and production database are available.

No migration is added in V94. The new health endpoints do not require authentication and reveal only generic operational status.
