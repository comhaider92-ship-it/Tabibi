# TABIBI V109 — Development Candidate

Date: 2026-11-22
Base: TABIBI V108

## Changes
- Corrected the advertisement target type so TypeORM receives the declared enum type.
- Made database configuration values explicitly typed as strings.
- Handled nullable appointment beneficiary identifiers safely.
- Replaced unsupported NestJS rate-limit exception imports with HTTP 429 responses.
- Added the missing class-validator Matches import.
- Corrected TypeORM null lookups for OTP and unread-message queries using IsNull().
- Made booking conversation mute lookups explicitly distinguish doctor and facility bookings.
- Added Express TypeScript declarations and dependency lockfiles for repeatable installs.
- Corrected the booking-message API response type in the mobile app.
- Fixed local date variable names that shadowed the dayStart helper in the provider dashboard.
- Restored the secure upload source files into the review source tree; these files were present in the V108 archive but ignored by the repository's uploads/ ignore rule.

## Verification
- NestJS backend build: PASS.
- Mobile TypeScript typecheck: PASS.
- Build-readiness check: PASS (dependencies and lockfiles present).
- Migration structural check: PASS (33 migrations inspected).
- Automated test suite: NOT CONFIGURED in V108; no test script or spec files were found.
- Device build / API connectivity: NOT VERIFIED. EXPO_PUBLIC_API_URL is not configured, so the mobile app cannot connect to a deployed backend from a physical phone yet.
- Database migration execution against a live database: NOT PERFORMED; only static migration checks were run.

## Dependency security status — NOT CLEARED
The dependency audit still reports vulnerabilities:
- Backend full dependency tree: 37 total (3 low, 21 moderate, 12 high, 1 critical).
- Backend production dependencies: 26 total (17 moderate, 8 high, 1 critical).
- Mobile dependency tree: 22 total (16 moderate, 5 high, 1 critical).
- Mobile production dependency tree: 22 total (16 moderate, 5 high, 1 critical).

Several suggested fixes require major-version upgrades of NestJS, bcrypt, Nodemailer, or Expo. These were not applied automatically because they could introduce breaking changes. They require a separate compatibility and security remediation pass.

## Release status
V109 is a development candidate with successful backend compilation and mobile typechecking. It is NOT a production-ready release until the dependency vulnerabilities are addressed, a real API URL is configured, and runtime/integration tests are added and passed.
