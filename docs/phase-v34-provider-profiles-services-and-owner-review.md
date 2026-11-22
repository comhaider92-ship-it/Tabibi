# Phase V34 — Provider profiles, facility services, and owner review

## Mobile doctor profile
- Added a doctor profile editor for required public identity and clinic fields.
- Added optional subspecialty, qualifications text, years of experience, bio, and photo URL.
- Supports saving a draft and explicitly submitting the profile for owner review.
- Displays profile status and the review note returned by the API.
- Qualifications, experience, bio, and photo remain optional; no field in this group blocks submission.

## Owner review queue
- Added `GET /api/v1/facilities/owner/pending` for owner-only pending facility review.
- Existing `GET /api/v1/doctors/owner/pending` is now connected to a mobile review screen.
- Owner can approve or reject doctor profiles and facilities; doctor review note can be supplied.
- Public directories continue to expose approved doctors/facilities only.

## Facility service management
- Added `PATCH /api/v1/facilities/owner/:id/services/:serviceId`.
- Owner can update service name, price (IQD), expected duration, and active state.
- Owner service listing includes inactive services so they can be reactivated.
- Schedule-management UI filters inactive services; the service-management UI can reactivate them.
- Deactivation is rejected while future requested/confirmed bookings exist for that service.

## API and migration
- Existing doctor profile and facility service tables already contain the fields used in this phase.
- No database migration is required.
- Qualifications are currently entered as text and photo as URL. Direct secure file upload/storage for certificates and photos is not included yet.

## Verification limits
- `scripts_verify_v34.py` provides source-level assertions only.
- Prior phase verification scripts are retained and rerun.
- Full dependency installation, TypeScript compilation, database integration tests, and Android device/APK testing are not claimed.
