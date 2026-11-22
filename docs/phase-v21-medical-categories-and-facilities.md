# Phase V21 — Medical specialties and diagnostic facilities

## Patient navigation
- Added a public grouped catalog endpoint: `GET /api/v1/medical-directory/categories`.
- The catalog separates doctor specialties from diagnostic services and includes Arabic display names and stable codes.
- Doctor specialty choices include pediatrics, obstetrics/gynecology, internal medicine, cardiology, orthopedics, dermatology, neurology, ophthalmology, dentistry, ENT, general surgery, urology, pulmonology, psychiatry, oncology, endocrinology, family medicine, nutrition, and other.
- Diagnostic choices include laboratories, MRI, x-ray, ultrasound, CT, mammography, ECG, echocardiography, bone density, and endoscopy.
- Existing doctor directory remains the source for doctor results; a selected specialty can be passed as the existing `specialty` filter. City remains the location filter; no district/area filter is introduced.

## Diagnostic facilities
- Added facility profiles, facility services, and patient facility booking requests.
- Public facility directory: `GET /api/v1/facilities?city=Basra&type=laboratory`.
- Active services for a facility: `GET /api/v1/facilities/:id/services`.
- Owner creates facilities and services; facilities remain pending until owner review approves them.
- Patient submits a booking request with facility, service, patient name, and requested date/time using `POST /api/v1/facilities/bookings` and an `Idempotency-Key` header.
- Patient can list their requests using `GET /api/v1/facilities/bookings/mine`.
- Booking requests are `requested`, not automatically confirmed. This avoids promising a live slot before the center's schedule/confirmation workflow is implemented. Database uniqueness prevents two active requests for the same service at the same facility and time.

## Database
Run migration `1732200000000-AddMedicalCategoriesAndFacilities` after the existing V20 migrations. TypeORM synchronize remains disabled.

## Verification
Run `python3 scripts_verify_v20.py` and `python3 scripts_verify_v21.py`. Static checks do not replace a TypeScript build, PostgreSQL migration test, or end-to-end booking test; those require installed dependencies and a running database.
