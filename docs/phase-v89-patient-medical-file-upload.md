# V89 — Patient medical file upload from mobile

## Delivered
- Added Expo Document Picker support to the patient health-file screen.
- Patients can select JPEG, PNG, WEBP, or PDF files from the phone and attach them to a selected health-file record.
- The picker copies the selected file into the app cache before the app reads it.
- The screen validates supported MIME type and a 10 MB maximum size, then displays the selected filename and size in a confirmation prompt before upload.
- The app reads the local file as Base64 and uploads it through the existing authenticated `/uploads` endpoint using the private `medical_attachment` category.
- After upload succeeds, the returned upload asset is linked to the selected medical record through the existing authenticated `/medical-records/:id/attachments` endpoint.
- The attachment list refreshes after successful linking.
- The patient is explicitly informed that uploading does not share the file with a doctor; doctor access still requires a separate active patient consent.
- No database migration, public file URL, permission relaxation, or owner access was introduced.

## Security and limits
- The backend remains authoritative for patient ownership, private storage, allowed MIME types, file signatures, 10 MB maximum size, and record-link ownership.
- Upload and link are separate existing server operations. If the upload succeeds but linking fails, the file remains private in the patient's uploaded assets and is not exposed in the health record.
- Doctor visibility and download continue to depend on the exact-record consent, expiry, revocation, and download permission checks already implemented.

## Verification
- `scripts_verify_v89.py` checks the mobile picker, MIME/size validation, confirmation, authenticated upload, record linking, and retained backend guards.
- Previous V86–V88 verification scripts are retained as regression checks.
- Full Expo TypeScript compilation, Android build, device picker tests, and staging API integration tests require installed mobile dependencies and a reachable configured API server; they are not claimed as completed here.
