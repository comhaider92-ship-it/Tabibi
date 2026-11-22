## V76 — Smart notification center

See `docs/phase-v76-smart-notification-center.md`. The mobile center now supports local search, category/unread filters, day grouping, pull-to-refresh, and safer related-item opening. Run `python scripts_verify_v76.py` for focused static checks. No migration is required.

# TABIBI Backend V22 — Patient Name-Based Search

حزمة موحدة مبنية على V11، وتضيف ملفات الأطباء ومراجعة المالك.

- بيانات الطبيب: الاسم، الاختصاص، الاختصاص الفرعي، المؤهلات، الخبرة، نبذة، العيادة، العنوان، المدينة، هاتف التواصل، ورابط الصورة.
- حالات الملف: draft / pending / approved / rejected.
- الطبيب يحفظ ملفه ويرسله للمراجعة.
- المالك وحده يعتمد أو يرفض الملف.
- دليل الأطباء العام يعرض الملفات المعتمدة فقط.
- تعديل الملف بعد الاعتماد يعيده للمراجعة.

التفاصيل والمسارات في `docs/doctor-profile-flow.md`.
هذه حزمة تأسيس برمجية، ولم يتم تثبيت الحزم أو تشغيل الخادم وقاعدة البيانات أو اختبارات التكامل.


## V13 Doctor scheduling
See `docs/phase-v13-doctor-scheduling.md`. Run the TypeORM migration before using availability endpoints.

## Phase V14 — Atomic booking

See `docs/phase-v14-atomic-booking.md` for the booking transaction, slot locking,
idempotency behavior, and manual acceptance checklist. The booking endpoint now
requires an exact open availability slot and closes it atomically when confirmed;
cancellation reopens that slot atomically.

Run the phase's static checks with:

```bash
python scripts_verify_v14.py
```

## Phase V15 — Appointment management

Authenticated patients and doctors can retrieve their appointment lists through `GET /api/v1/appointments`. Patient results include appointments they booked and appointments booked for them; doctor results are limited to their own appointments. Optional status/date filters and bounded pagination are supported. See `docs/phase-v15-appointment-management.md`.


## Phase V16 — Appointment details and status history

See `docs/phase-v16-appointment-details-and-status.md`. Appointment detail access is scoped to involved parties; doctors/owners can record completion or no-show after the appointment start, and status changes are audited. There is no fixed daily booking cap; doctors define their own slots (up to 200 per API batch). Run the new migration before deployment.

## Phase V17 — In-app notifications

Phase V17 adds a persistent notification inbox for booking, cancellation, completion, and no-show events. Notifications are inserted in the same database transaction as the related appointment change. Authenticated users can list their own notifications, view unread counts, and mark notifications read. See `docs/phase-v17-notifications.md` for API details and delivery boundaries.

## Phase V18 — Push notifications and reminders

V18 adds authenticated device-token management, per-user push/reminder preferences, Firebase Cloud Messaging delivery, and a durable 24-hour/2-hour appointment reminder queue. Configure `FIREBASE_SERVICE_ACCOUNT_JSON`, install dependencies, run migrations, and register device tokens from the mobile app. See `docs/phase-v18-push-and-reminders.md` for deployment details. Without Firebase credentials, in-app notifications remain available and push delivery is disabled safely.


## Phase V19 — Doctor ratings

Adds completed-appointment ratings, one-rating-per-appointment enforcement, 1–5 stars, optional patient comments, doctor rating summaries, patient reporting, and owner moderation. Run migration `1732000000000-CreateDoctorRatings` after prior migrations. See `docs/phase-v19-doctor-ratings.md`.


## Phase V20 — Doctor directory search and public profiles

See `docs/phase-v20-doctor-directory.md`. The public directory supports name, specialty, sub-specialty, city, minimum rating, sorting, and pagination. District/area filtering is intentionally excluded; only approved doctors are publicly listed.

## V21 — Medical categories and diagnostic facilities

This release adds a public Arabic medical category catalog (`GET /api/v1/medical-directory/categories`) and a diagnostic facility directory/booking-request workflow (`/api/v1/facilities`). See `docs/phase-v21-medical-categories-and-facilities.md` for endpoint details and migration instructions. Facility booking requests await center confirmation; live facility calendars and automatic slot confirmation are a follow-on workflow.


## V22 — Easy search by doctor, facility, or service name
- Doctor directory accepts `q` to search by doctor name, specialty, sub-specialty, or clinic name; the previous `name` parameter remains supported.
- Facility directory accepts `q` to search by facility name or active service name, such as a laboratory, MRI, ultrasound, or CT service.
- Facility filters include `name`, `serviceName`, `city`, and `type`.
- Public facility search returns approved centers only and omits the owner's internal account identifier.
- See `docs/phase-v22-name-based-search.md` for examples and behavior.

## Phase V23 – Facility appointment slots and booking decisions

V23 adds individual appointment slots for laboratories and imaging/diagnostic centers. Facility owners can publish future slots for their active services, review requests, and confirm or reject them. Patients can view available slots, book a concrete slot, and cancel their own future booking. Slot reservation is transactionally locked to prevent two patients from booking the same slot.

Apply the new migration after V22 with `npm run migration:run`. See `docs/phase-v23-facility-scheduling-and-booking-management.md` for endpoint details and limitations. Facility booking decisions are not yet connected to push notifications; requests remain pending until the facility owner acts.


## Phase V24 — Facility booking notifications

V24 connects facility booking lifecycle events to the existing in-app notification inbox and optional Firebase push delivery. A new request notifies the facility owner; confirmation or rejection notifies the patient, including an optional rejection reason. Notification delivery is attempted after the booking transaction commits, and notification-provider failures do not turn a committed booking into an apparent failure. See `docs/phase-v24-facility-booking-notifications.md`.

Apply migration `1732400000000-UpdateFacilityBookingSlotUniqueness` after V23. It also fixes rebooking a slot released after rejection/cancellation. Run static checks with `python scripts_verify_v24.py`. Mobile token registration/OS permission handling and a real-device Firebase test remain app/deployment integration tasks.

## V25 – Weekly schedules for doctors and facilities

See `docs/phase-v25-weekly-schedules-doctors-and-facilities.md` for the shared weekly schedule model, doctor work periods/breaks, service-specific facility schedules, and slot generation endpoints. Apply migration `1732500000000-CreateWeeklySchedulesForDoctorsAndFacilities` before use.


## V26 – Exceptional schedule closures

- Doctors can create, list, and restore temporary schedule closures by exact date/time range.
- Facility owners can create closures for an entire facility or one service, list them, and restore them.
- Available slots overlapping a closure are hidden from booking and marked closed; facility slots use a dedicated `closed` state.
- Existing confirmed/requested bookings are never cancelled automatically. The closure response lists affected bookings and returns a warning for owner review.
- New and manually re-opened slots are checked against active closures. Restoring a closure reopens only the slots that were open when that closure was created and are not covered by another active closure.
- Apply migration `1732600000000-CreateScheduleExceptions` before using these endpoints.

## Phase V27 — Dashboard summaries

V27 adds read-only dashboard summary endpoints:
- `GET /api/v1/dashboard/doctor` for doctor appointment, slot, and closure summaries.
- `GET /api/v1/dashboard/facilities/:facilityId` for owner-only facility booking, slot, service, and closure summaries.

Both support optional `from` and `to` ISO-8601 query parameters (maximum 93-day range). No migration is required for V27. These endpoints provide backend data only; mobile/web dashboard screens are not included yet. See `docs/phase-v27-dashboard-summaries.md`.

## V28 — Mobile patient app foundation

The `mobile/` folder now contains the first Expo / React Native patient-app scaffold: login, patient home and category directory, name-based doctor/facility search, provider details, facility service/slot booking, and a combined bookings list. Configure `EXPO_PUBLIC_API_URL` before running. See `mobile/docs/phase-v28-mobile-patient-foundation.md` for installation, limitations, and next steps. This phase adds no database migration and does not yet complete doctor slot selection or production authentication persistence.

Run static phase checks with `python scripts_verify_v28.py`.


## V29 — Booking for another person

Doctor appointments now support either a registered beneficiary (`beneficiaryId`) or a guest beneficiary (`beneficiaryName`, optional `beneficiaryPhone`). Run migration `1732700000000-AllowGuestBeneficiaryDoctorBookings` before deploying. See `docs/phase-v29-book-for-another-person.md`.

## V33 — Mobile schedule management for doctors and facility owners

The Expo mobile app now exposes schedule management from the authenticated doctor and facility-owner dashboards. Doctors can manage weekly working days/time windows, optional daily breaks, individual future availability slots, and slot open/closed status. Facility owners can manage schedules independently per service, generate slots for up to 31 days using each service's configured duration, and manage the availability/closure state of individual slots. Both roles can create and restore temporary schedule exceptions. New owner-scoped facility routes support listing services, weekly schedules, and slots even when a facility is still awaiting approval. Slot status changes are blocked when a facility slot has a requested or confirmed booking; reopening revalidates weekly schedules and active exceptions.

No database migration is required for V33. See `docs/phase-v33-mobile-schedule-management.md`. Run `python scripts_verify_v33.py` for the V33 static source checks. The full static suite currently reports 331/331 checks. TypeScript/TSX syntax transpilation passed for 111 source files; full type checking, Expo bundling, backend build, database integration tests, and physical Android testing remain outstanding because project dependencies are not installed in this environment.


## Latest phase: V34

V34 adds mobile doctor profile editing and submission, owner review queues for pending doctor/facility profiles, and owner management of facility service names, prices, durations, and active state. Existing schema supports these fields; no migration is required. See `docs/phase-v34-provider-profiles-services-and-owner-review.md`.

## Latest phase: V35 — Owner administration and manual subscriptions

V35 adds doctor subscription requests with manual transfer references/optional proof links, owner approval/rejection and configurable activation duration, subscription expiry enforcement at the doctor booking endpoint, owner account administration, revenue/count summaries, and audit records for profile/facility/subscription/account decisions. A doctor whose subscription expires remains visible in the public directory but cannot receive new appointments until a new manual subscription is approved. No automatic renewal or payment-gateway processing is included.

New migration: `1732800000000-CreateDoctorSubscriptionsAndOwnerAudit`. Apply migrations before deploying V35. The mobile app now includes doctor subscription and owner administration screens. See `docs/phase-v35-owner-subscriptions-and-admin.md`.

Run all static checks with `python scripts_verify_v35.py` and the full historical suite with the `scripts_verify_v14.py` through `scripts_verify_v35.py` scripts. The suite reports 380/380 checks. TypeScript/TSX syntax transpilation passed for 126 files. Full backend type-check/build, Expo bundling, database integration tests, and physical Android testing remain outstanding because dependencies and a database are not installed in this workspace.

## V36 — Advertising and revenue
V36 adds owner-managed ad campaigns, manual IQD payment tracking, ad schedule and placement, active/paused/ended states, public home/search ad slots, impression/click counters, and an owner revenue/performance report. Apply migration `1732900000000-CreateAdvertisements` before enabling the feature. Ad payments are recorded manually; there is no online payment gateway or advertiser self-service yet. See `docs/phase-v36-advertising-and-revenue.md`.


## V37 — تقارير المالك والإعلانات المرتبطة
راجع `docs/phase-v37-owner-finance-and-linked-ads.md`. تمت إضافة ربط الإعلانات بطبيب أو مركز/مختبر أو مستشفى أو إعلان مستقل، وتقارير مالية يومية وشهرية للمالك. يلزم تطبيق Migration V37.

## Phase V65 — Remove queue notifications and queue states

Per product-owner decision, V65 removes all queue-state tracking and queue-call notifications. Providers retain their daily booking lists and manage calling patients directly outside the app. Existing booking lifecycle statuses and ordinary booking notifications remain. Apply migration `1733600000000-RemoveDailyQueueStates` after V64 if V64 was deployed. See `docs/phase-v65-remove-queue-notifications-and-states.md`.

## V86 — Patient comprehensive health file
- Adds `GET /api/v1/medical-records/health-file` to combine the patient's medical timeline with structured prescriptions, laboratory results, clinical reports, and attachment counts.
- Supports type/date filters and bounded pagination; the complete timeline is patient-only and every read is audited.
- No migration required. See `docs/phase-v86-comprehensive-health-file.md` and run `python scripts_verify_v86.py`.

## V87 — Mobile patient health-file timeline
V87 adds the patient-facing health-file timeline, record-type filters, pagination, and structured prescription/lab/report details. See `docs/phase-v87-mobile-health-file.md` and run `python scripts_verify_v87.py`.

## V88 — Secure attachment viewing and sharing controls
V88 connects authenticated attachment metadata and download flows to the patient health file, and exposes the patient's existing consent list and full-consent revocation controls. Download access remains gated by the server's consent checks. See `docs/phase-v88-medical-attachment-viewing-and-sharing.md` and run `python scripts_verify_v88.py`.

## V89 — Patient upload of medical attachments
V89 lets patients select supported JPG/PNG/WEBP images and PDF files from the phone, confirm the filename and size, and upload them to a selected health record. The server enforces the 10 MB limit and validates file signatures. Uploading does not grant a doctor access; separate patient consent remains required. See `scripts_verify_v89.py`.

## V90 — Granular medical-sharing revocation
V90 lets a patient revoke access to one record inside an existing doctor-sharing consent while preserving access to the other records in that consent. The operation is patient-scoped, transactionally locks the consent row, records an audit event, and automatically marks the consent revoked if its final record is removed. Full-consent revocation remains available. See `docs/phase-v90-granular-medical-sharing-revocation.md` and run `python scripts_verify_v90.py`.

Run the V86–V90 static verification scripts with Python. Full TypeScript type-checking/build, Expo bundling, database integration tests, and physical Android testing still require the project's external dependencies and a configured database/device; they were not run in this source-only workspace.


## V92 — Account login activity

See `docs/phase-v92-account-login-activity.md`. The account security screen now displays recent successful and failed login attempts from the existing private account activity endpoint. No migration is required. Run `python scripts_verify_v92.py` for focused static checks.

## V93 — Android build configuration readiness

V93 adds a pre-build configuration check for the existing EAS Android preview and production profiles. Before creating an APK for a physical phone, set `EXPO_PUBLIC_API_URL` to a reachable backend URL ending in `/api/v1`; preview and production checked build commands reject missing or emulator-only hosts, and production requires HTTPS. See `mobile/docs/phase-v93-android-build-readiness.md`. This does not deploy the API/database or generate an APK; those still require an externally reachable backend and an authenticated EAS build environment.

## V94 — Production readiness baseline

See `docs/phase-v94-production-readiness-baseline.md`. This phase aligns the standalone TypeORM migration data source with the application's clinical-report entity registration, removes the authentication service's fallback JWT secret, and adds database-aware health probes:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

No migration is added. Build, PostgreSQL migration execution, live health-probe checks, and Android device build remain to be run in a configured environment.

## V99 — Strict upload payload validation

- Upload requests now enforce a category-aware Base64 encoded-length ceiling before decoding (5 MiB for profile images; 10 MiB for documents and private medical attachments).
- Invalid Base64 alphabet/padding and non-canonical encodings are rejected before storage.
- Decoded byte length and existing MIME signature checks remain enforced.
- Verification: `scripts_verify_v99.py` (7/7), `scripts_verify_v98.py` (11/11), `scripts_verify_v97.py` (7/7), and focused V90–V94 regression scripts passed.
- Full TypeScript build was not possible in this environment because project dependencies (NestJS, TypeORM, class-validator, and Node type packages) are not installed. Run `npm ci` and `npm run build` in the connected build environment before deployment.

## V100 — Medical attachment lifecycle safeguards

- Fixed a duplicated Base64 validation declaration in `UploadsService` that prevented TypeScript compilation; the strict pre-decode size/alphabet checks from V99 remain in place.
- Medical attachment linking now runs in a database transaction and locks the patient-owned, non-deleted medical record and private upload asset before creating the unique link. This reduces duplicate-link races while retaining the database unique constraint.
- Added `DELETE /api/v1/medical-records/:id/attachments/:uploadAssetId` for the patient who owns the record. It removes only the relationship, retains the private upload asset and stored bytes for possible relinking, and writes an `attachment_unlink` access-history event.
- Unlinked assets are no longer exposed through that medical record to doctors; doctor access continues to require an approved doctor profile, a live patient consent, and explicit download permission. Medical attachment downloads remain audit-logged.
- Soft-deleting a medical record does not physically erase its attachments or upload assets; normal attachment listing and doctor access continue to exclude deleted records.
- Verification: `python scripts_verify_v100.py` (13/13), plus V90–V94 and V97–V99 regression scripts passed.
- Full dependency-backed TypeScript build remains unverified in this workspace because project dependencies are not installed; run `npm ci` followed by `npm run build` in the connected build environment before deployment.

## V101 — Safe medical-upload retention audit

- Added `docs/operations/medical-upload-retention-audit.sql`, a read-only report for private medical uploads that are not currently linked, attachments whose medical record was soft-deleted, and superseded doctor/facility profile images.
- The report is for owner/operator review only. Detached patient uploads may be intentional, and soft-deleted medical records may remain relevant to audit history; no automatic purge or destructive cleanup is introduced.
- Run the SQL with a database account that has SELECT privileges only. Review each result against the applicable retention policy and legal requirements before any separately approved deletion process is designed.
- Existing behavior remains: record deletion is soft-delete, unlinking retains the upload asset and bytes, and public profile-image delivery checks that the asset is still the currently selected image.
- Verification: `python scripts_verify_v101.py`.

## V102 — Authorization regression audit

V102 adds `scripts_verify_v102.py` with 18 focused static checks covering patient-only public registration, active/revocable session enforcement, role guards, patient/doctor medical-record scoping, patient-consent-controlled attachment downloads, appointment ownership, and owner-only advertisement management. See `docs/phase-v102-authorization-regression-audit.md`. These checks are source-level regression tests only; dependency-backed build, PostgreSQL integration tests, and penetration testing remain required before deployment.

## V103 — Connected build preparation

V103 adds a truthful build-readiness audit and a connected-environment build script. Run `npm run check:build-readiness` to see missing lockfiles/dependencies and mobile API URL readiness. In a network-enabled environment, run `./scripts/prepare-connected-build.sh` to generate missing lockfiles, install with `npm ci`, run the Nest backend build, run the mobile TypeScript check, and validate Expo configuration. This source-only workspace could not install packages because registry DNS resolution failed; no dependency-backed build or Android APK is claimed. See `docs/phase-v103-connected-build-preparation.md`.

## V104 — Database migration compatibility

V104 standardizes UUID defaults in the medical-record and secure-upload migrations on PostgreSQL `gen_random_uuid()`, avoiding an undeclared `uuid-ossp` extension dependency on fresh PostgreSQL 16 deployments. TypeORM schema synchronization remains disabled and production migrations remain an explicit, backup-gated operator action. See `docs/phase-v104-database-migration-compatibility.md`.

## V105 — Migration preflight audit

Added `npm run check:migrations` to statically inspect all 33 TypeORM migrations for timestamp format and uniqueness, execution ordering, filename/class alignment, paired `up`/`down` methods, and PostgreSQL `pgcrypto` availability before UUID defaults are used. Added `npm run migration:show` to inspect pending migrations in a dependency-installed environment. Deployment guidance now requires reviewing the pending list before applying migrations. This stage does not claim a live PostgreSQL migration or restore test: this workspace has no `psql`, Docker, or Podman runtime available.


## V106 — Production startup and reproducible container build

- Production startup now rejects missing database credentials, weak database passwords, non-absolute upload paths, and non-HTTPS public API URLs.
- PORT and NODE_ENV are validated before application modules initialize.
- The HTTP server binds explicitly to 0.0.0.0 for container networking and enables graceful shutdown hooks.
- Docker builds require a reviewed package-lock.json and use `npm ci` rather than an unconstrained `npm install`.
- A successful Docker image build and production database connection still require a network-enabled dependency install and real deployment environment.


## V108 — Owner bootstrap and database readiness correctness

- Owner bootstrap now normalizes the configured owner email before lookup and creation.
- If `OWNER_EMAIL` already belongs to a patient or doctor account, startup fails clearly instead of silently skipping owner creation or promoting that account. Existing owner accounts are left unchanged; the bootstrap password is not used to overwrite an existing account password.
- The readiness endpoint now requires both database connectivity and no pending TypeORM migrations. A database that answers `SELECT 1` but has not been migrated is not reported as ready.
- Verification: `scripts_verify_v108.py` contains focused source-regression checks. Live PostgreSQL startup/readiness and full dependency-backed build remain required in a connected environment.
