# Phase V19 — Doctor ratings and moderation

## Scope
- A patient may rate only an appointment for which they are the beneficiary.
- The appointment must be `completed`; cancelled, confirmed, and no-show appointments cannot be rated.
- One rating per appointment is enforced in the service and by a unique database index.
- Ratings contain 1–5 stars and an optional comment up to 1,000 characters.
- Only published ratings appear in a doctor's rating list and aggregate.
- The rating owner can report their own rating; reported ratings enter `under_review`.
- Owner-only moderation can publish, hide, or return a rating to review, with moderator and timestamp recorded.

## API
- `POST /ratings` (patient): `{ appointmentId, stars, comment? }`
- `GET /ratings/doctor/:doctorId` (authenticated): published ratings and aggregate
- `POST /ratings/:id/report` (patient, own rating only)
- `GET /ratings/owner/review-queue` (owner)
- `PATCH /ratings/:id/moderate` (owner): `{ status, note? }`

## Migration
Run `1732000000000-CreateDoctorRatings` after the previous migrations. Database synchronization remains disabled.

## Notes
This phase adds API and persistence only. It does not include a mobile/web rating UI, public anonymous browsing, or an automated content classifier. Owner moderation is manual. Run the TypeScript build and PostgreSQL integration tests in the deployment environment before release.
