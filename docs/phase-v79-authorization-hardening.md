# V79 — Upload authorization and managed profile-image hardening

## Scope
- Authenticated downloads now enforce a role/category match even when the requesting account owns the asset: doctor accounts may access doctor photos/qualifications; owner accounts may access facility images/documents.
- Cross-account downloads remain denied except for the owner review workflow, and that exception is limited to assets that are still pending review.
- Doctor profile photo URLs supplied through profile updates must be exact application-managed upload paths.
- The referenced image must exist, belong to the same doctor account, have the doctor-photo category, and be marked public.
- Legacy external or otherwise unmanaged doctor photo URLs are cleared during profile updates when no replacement URL is supplied.
- The UploadAsset entity is registered with the doctor module for this ownership validation.

## Verification
- `python scripts_verify_v79.py`: 13/13 static contract checks passed.
- Regression scripts V73–V78: 101/101 static checks passed.
- Total across V73–V79: 114/114 static checks passed.
- ZIP archive integrity verified with `ZipFile.testzip()`.

## Limitations
No runtime NestJS build, database-backed authorization test, live API test, or penetration test was run because dependencies and a configured database/runtime are not present in this working copy. Static checks do not replace those tests.
