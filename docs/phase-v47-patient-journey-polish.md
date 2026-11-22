# V47 – Patient journey polish

## Scope
Improve the patient-facing search, provider details, and booking confirmation flow without changing backend booking rules or the existing account/beneficiary model.

## Changes
- Doctor search results are normalized from the backend's paginated `{ items, pagination }` response; facility search continues to accept its array response.
- Search state is refreshed when the user switches between doctor and facility search or returns with a new initial query.
- Added optional governorate filtering for both doctors and facilities, using the existing `city` query supported by the backend. The removed neighborhood/area filter remains absent.
- Search displays the number of returned results and more helpful empty-state guidance.
- Doctor details now load the full approved public profile, including optional biography, qualifications, experience, photo, and published rating summary.
- Facility details load active services and show service duration and price in Iraqi dinars.
- Booking availability window is extended from 14 to 30 days. Empty availability states and a refresh action are shown.
- Before sending a booking, the patient sees a summary of the selected provider/service, beneficiary, and appointment time and explicitly confirms.
- Existing behavior is retained: doctor booking for self uses the signed-in patient's beneficiary ID; booking for another person uses the guest beneficiary name/phone; facility booking sends the patient name and optional phone; backend remains the authority for availability, authorization, and cancellation.

## Verification limits
- `scripts_verify_v47.py` contains static source assertions.
- This phase does not claim a full NestJS build, Expo bundle, Android APK, live API test, or real database integration test.
