# V29 — Doctor booking for another person without an account

## User experience
- The patient chooses either **book for myself** or **book for another person**.
- Self-booking continues to use the signed-in account as `beneficiaryId`.
- For another person, the patient enters a name and an optional phone number. The other person does not need to register or create an account.
- Facility booking keeps its existing patient-name / optional-phone workflow.

## API
`POST /api/v1/appointments` now accepts either:
- `beneficiaryId` for a registered beneficiary; or
- `beneficiaryName` and optional `beneficiaryPhone` for a non-account beneficiary.

The booking account remains `bookedByUserId` and is always authenticated. This preserves ownership and cancellation permissions. Patient appointment lists include bookings made by the signed-in account; details expose the guest beneficiary name and optional phone.

## Data migration
`1732700000000-AllowGuestBeneficiaryDoctorBookings` makes `appointments.beneficiaryId` nullable and adds `beneficiaryName` and `beneficiaryPhone`. A database check requires either a registered beneficiary or a non-empty beneficiary name.

Apply the migration before deploying this API/mobile build. Existing appointments are preserved.

## Notifications and reminders
The doctor and booking account continue receiving notifications. A guest without a user account is not sent account notifications or push reminders. Existing registered-beneficiary notifications and reminders remain unchanged.

## Boundaries
- Guest beneficiary cannot log in, view their own bookings, or receive in-app reminders until they create an account.
- The signed-in booker can view and cancel the booking under existing authorization rules.
- This is a patient mobile workflow foundation; it has not been run on a physical Android device or built as a production APK in this environment.
