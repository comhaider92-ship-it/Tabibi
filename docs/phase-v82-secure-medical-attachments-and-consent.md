# V82 — Secure medical attachments and patient-controlled sharing

## Scope

V82 extends V81 without changing its patient/doctor/owner boundaries. It adds private patient medical uploads, record-to-file links, explicit patient grants to an approved doctor for selected record IDs, expiry, revocation, a doctor inbox for currently shared records, and download permission as a separate consent flag.

## Upload rules

- `medical_attachment` uploads are accepted only from patient accounts.
- Medical attachments are always private (`isPublic = false`) and have no public URL.
- Accepted MIME types are JPEG, PNG, WEBP, and PDF; the existing byte-signature checks remain enabled.
- Medical attachment limit is 10 MiB per file. Existing profile-image limits remain 5 MiB.
- Files are stored in the existing private upload directory with random UUID storage keys and restrictive directory/file modes.
- The patient links an uploaded asset to one active record using `POST /api/v1/medical-records/:id/attachments`.
- A medical asset can be linked only once and only to a non-deleted record owned by its uploader.

## Patient consent

- `POST /api/v1/medical-records/share-consents` grants access to one approved doctor and a unique list of 1–50 record IDs owned by the patient.
- Expiry must be in the future and no more than 30 days ahead.
- `allowDownload` defaults to false. Viewing shared records/attachment metadata does not itself authorize downloading the binary file.
- `DELETE /api/v1/medical-records/share-consents/:id` revokes the grant. Revocation and expiry are checked again when the doctor attempts to download a file.
- `GET /api/v1/medical-records/share-consents` lets the patient review their grants.
- `GET /api/v1/medical-records/shared-with-me` lists records currently shared with the authenticated doctor.

## Attachments and audit

- `GET /api/v1/medical-records/:id/attachments` is available to the patient owner or a doctor with an active grant covering that exact record.
- The response includes a download URL only when the actor is the patient owner or the active consent explicitly allows download.
- The existing authenticated upload download route rechecks record ownership, active record state, doctor identity, consent expiry/revocation, exact record scope, and `allowDownload`.
- Record view/share/revoke and attachment link/list/download actions are written to `medical_record_access_logs`. No clinical text or file contents are copied into the audit log.

## API summary

- `POST /api/v1/uploads` with category `medical_attachment` (patient role only)
- `POST /api/v1/medical-records/:id/attachments`
- `GET /api/v1/medical-records/:id/attachments`
- `POST /api/v1/medical-records/share-consents`
- `GET /api/v1/medical-records/share-consents`
- `DELETE /api/v1/medical-records/share-consents/:id`
- `GET /api/v1/medical-records/shared-with-me`

## Database

Run migration `1734300000000-ExtendMedicalRecordsSharingAndAttachments` before enabling V82. `synchronize` remains disabled. The migration adds attachment and consent tables/indexes and expands the audit action column to 32 characters.

## Operational limitations

Static source checks do not prove runtime correctness. Before production, run the Nest build, apply migrations to a staging PostgreSQL database, test upload/download and revocation end-to-end, and run malware scanning/content-disarm and backup/retention procedures appropriate to the deployment. V82 does not claim to provide antivirus scanning or a production PDF export pipeline.
