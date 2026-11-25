# V87 — Patient health file mobile experience

## Delivered
- Added the patient-facing `ملفي الصحي` entry to the patient home screen.
- Registered a dedicated patient-only mobile screen and connected it to the authenticated V86 `GET /api/v1/medical-records/health-file` endpoint.
- Added a typed API client method with server-side pagination and record-type filtering.
- Added filters for all, visit summaries, diagnoses, prescriptions, lab results, and notes.
- Added newest-first record cards, expandable details, refresh, and a load-older action.
- Displays structured prescription medication details, laboratory values/reference ranges/comments, and clinical report sections/recommendations/follow-up.
- Displays attachment counts only; does not expose upload identifiers, storage paths, or download URLs in the health-file screen.
- Clarifies that the timeline is a record viewer and not an automated diagnosis.
- Retains V86 patient-only authorization and per-record access auditing; no migration required.

## Verification
- `scripts_verify_v87.py`: 14/14 static checks passed.
- `scripts_verify_v86.py`: 15/15 static checks passed.
- Mobile TypeScript compilation was not run successfully because this archive does not contain installed `mobile/node_modules` dependencies. A full Expo/React Native typecheck and device UI test remain required in an environment with dependencies installed.

## Notes
- This phase connects the already implemented backend health-file API to the mobile patient app. It does not change clinical permissions or allow the owner to read medical records.
- Actual attachment opening remains governed by the existing secure attachment endpoints and their consent/access checks; this screen intentionally shows only the attachment count.
