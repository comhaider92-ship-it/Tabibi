# V71 — Secure patient contact change

- Adds authenticated endpoints to request and confirm a phone/email change for the current account only.
- Uses dedicated `change_phone` and `change_email` OTP purposes; each OTP is bound to the authenticated account and exact normalized destination.
- Validates email and international-style phone input, checks destination uniqueness before sending, and handles database unique-index races.
- OTP expires after five minutes, is resend-throttled for 60 seconds, and is limited to five attempts.
- The existing phone/email remains unchanged until the OTP is successfully confirmed.
- Patient profile UI now supports requesting and confirming a contact change; the app refreshes profile data only after confirmation.
- Does not change provider profiles, owner accounts, password reset, registration verification, booking data, or the no-saved-beneficiaries decision.

## Operational note

Real SMS/email delivery still depends on production provider configuration (`SMS_API_URL`, `SMS_API_TOKEN`, or SMTP settings). Development mode may log OTP values; production does not use that development fallback. No live provider or database integration test is claimed in this source-contract phase.
