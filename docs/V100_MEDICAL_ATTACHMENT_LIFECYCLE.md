# V100 — Medical attachment lifecycle safeguards

## Scope

This stage hardens the relationship between private uploaded files and patient medical records. It does not physically delete stored medical files.

## Changes

1. Removed a duplicated Base64 validation block in `src/uploads/uploads.service.ts`. The strict encoded-length, alphabet/padding, canonical round-trip, decoded-size, and file-signature checks remain active.
2. Changed medical attachment linking to a transaction. The patient-owned active record and patient-owned private medical upload asset are locked before checking/creating the unique attachment relationship.
3. Added patient-only unlinking at `DELETE /api/v1/medical-records/:id/attachments/:uploadAssetId`.
4. Unlinking deletes only the `medical_record_attachments` relationship. It retains the `upload_assets` row and private file bytes, so the patient may relink the file later.
5. Every unlink is recorded as `attachment_unlink` in the medical access history.

## Access and retention behavior

- A doctor still needs an approved profile, an active unrevoked/unexpired patient consent covering the record, and `allowDownload = true` to download an attachment.
- Once unlinked, the attachment is no longer reachable through that record by a doctor.
- The patient remains the owner of the private uploaded file after unlinking.
- Soft-deleting a medical record preserves its attachment relationships and underlying upload assets. Normal record/attachment views and doctor download checks exclude deleted records.
- No automatic physical-file garbage collection is introduced. Safe permanent deletion requires a separate retention policy and a complete reference audit across all entities.

## Verification

- `python scripts_verify_v100.py` — 13/13 static checks passed.
- V90 — 15/15; V91 — 14/14; V92 — 8/8; V93 — 11/11; V94 — 9/9.
- V97 — 7/7; V98 — 11/11; V99 — 7/7.
- `python -m py_compile scripts_verify_v100.py` passed.
- Full TypeScript build is not claimed: install dependencies in a connected environment with `npm ci`, then run `npm run build`.
