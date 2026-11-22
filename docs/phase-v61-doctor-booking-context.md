# V61 — Doctor booking context and beneficiary contact

## Changes
- Doctor appointment-list responses now include the display name of the account that placed the booking (`bookedBy`) so the doctor can distinguish a booking made by a relative from a self-booking.
- Doctor responses include the beneficiary phone number for both registered and guest beneficiaries.
- Patient appointment-list responses do not receive the booker's identity or beneficiary phone number through these new fields.
- Doctor dashboard cards display beneficiary name, phone when available, and booking-account display name when it differs from the beneficiary.
- Existing appointment status actions remain limited in the UI to confirmed appointments whose start time has arrived; the server continues to enforce role, ownership, status and time checks.

## Privacy note
The phone number is exposed only to the assigned doctor through the authenticated doctor appointment-list endpoint. The patient list does not receive the additional phone/booker fields. A privacy review should still confirm the product's consent wording for sharing a guest beneficiary's phone with the treating doctor.

## Verification
Run `python scripts_verify_v61.py` for 12 source-contract checks.
This is a source-level regression check, not a live API/database test. No PostgreSQL integration, mobile runtime test, or APK build is claimed in this phase.
