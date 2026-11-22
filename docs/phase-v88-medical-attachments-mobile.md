# V88 — Patient medical attachment access and consent controls

## Delivered
- Connected the patient health-file screen to the existing authenticated medical-record attachment listing endpoint.
- Added on-demand attachment metadata loading for each record, including original filename, MIME type, size, and creation date.
- Added protected attachment download through the authenticated upload endpoint; the app supplies the current bearer token and opens the downloaded file through the native sharing/open sheet.
- Download remains available only when the server returns `canDownload: true`. The mobile app does not construct public URLs or bypass the server permission check.
- Added a patient-facing list of previously granted doctor-sharing consents, including doctor user ID, record count, expiry, download permission, and active/expired/revoked state.
- Added explicit confirmation before revoking a grant. The server performs the revocation and the UI updates only after success.
- No schema migration or backend permission relaxation was introduced. V82's exact-record scope, expiry, revocation, and separate download consent remain authoritative.
- Added Expo FileSystem and Sharing dependencies compatible with the Expo SDK 52 application.

## Verification
- `scripts_verify_v88.py` performs static regression checks for the mobile API wiring, patient UI, authenticated file download, consent revocation, and backend permission guards.
- `scripts_verify_v87.py` and `scripts_verify_v86.py` are retained and run as regression checks.
- Full React Native/Expo typecheck, Android build, physical-device file opening, and staging API tests require installing mobile dependencies and configuring a reachable API server; they are not claimed as completed in this source-only environment.

## Security notes
- Medical files are not exposed through public URLs.
- Download requests carry the current access token and are re-authorized by the backend at download time.
- Revocation is checked by the backend again on subsequent doctor access/download attempts.
- Native sharing is initiated only by an explicit patient tap. The patient controls any subsequent sharing action in the operating system sheet.
- V88 intentionally does not add a patient file-picker/upload flow. Upload/linking remains on the existing secure V82 backend API and can be surfaced in a later phase with a supported document-picker integration.
