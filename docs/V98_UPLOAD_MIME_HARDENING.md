# V98 — Upload MIME Type Hardening

## Change
- Doctor profile photos and facility images accept JPEG, PNG, and WebP only.
- Private patient medical attachments accept JPEG, PNG, WebP, and PDF.
- Doctor qualification and facility documents remain PDF-only.

## Preserved safeguards
- Declared MIME type is checked against the file signature.
- Existing size limits, private storage, access-control checks, patient consent checks, and medical attachment access logging remain in place.

## Verification
- `python scripts_verify_v98.py` — 11/11 static checks passed.
- ZIP integrity check passed after packaging.
- NestJS build was not run: project dependencies (`node_modules` / Nest CLI) are not installed in this environment. Run `npm install` and `npm run build` in the project environment before deployment.
