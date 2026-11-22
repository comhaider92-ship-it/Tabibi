# V50 — OTP delivery, device push registration, and subscription renewals

## 1) OTP delivery adapters

`OtpDeliveryService` now supports:
- Email over SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`).
- SMS through a provider-neutral HTTP adapter (`SMS_API_URL`, `SMS_API_TOKEN`, `SMS_SENDER_ID`).

The SMS adapter sends `POST` JSON `{ "to": "...", "message": "...", "sender": "..." }` with `Authorization: Bearer ...`. The configured endpoint must accept this contract and return HTTP 2xx only after accepting the message. If the chosen Iraqi SMS vendor uses a different contract, implement a small adapter for that vendor; do not paste provider credentials into source code.

Development without provider settings logs a development-only OTP. Production never logs the code and returns a service-unavailable error when the corresponding delivery channel is not configured. If delivery fails, the newly-created OTP row is deleted so a failed send does not block retry for the resend interval.

## 2) Push registration

The mobile app now requests notification permission on a physical device, creates the Android `tabibi_appointments` channel, obtains the native device token, and registers it through `POST /api/v1/notifications/devices`. On logout it deactivates the registered device token.

Production prerequisites:
- Configure `FIREBASE_SERVICE_ACCOUNT_JSON` on the backend using the Firebase service-account JSON as a single-line secret.
- Configure the Android Firebase app and provide `google-services.json` to the native/EAS build (`android.googleServicesFile` in Expo config); do not commit private credentials.
- V50 registers native FCM tokens on physical Android devices. iOS registration is deliberately deferred: the native iOS token is an APNs token and must not be stored as an FCM token. Add a dedicated APNs/Expo Push adapter before enabling iOS push.
- Build and test an Android development/production native build on a physical device. Expo Go or a syntax check is not proof of FCM delivery.

The existing backend Firebase Admin integration remains responsible for sending FCM messages and disabling invalid Android device tokens.

## 3) First subscription approval vs renewal payment verification

- The first subscription has `requiresOwnerApproval=true` and needs the owner's eligibility approval.
- Once the doctor has a prior `active` or `expired` approved subscription, subsequent requests are renewals with `requiresOwnerApproval=false`.
- Renewals do not enter the owner's eligibility-approval flow. The owner receives a notification and only confirms whether the transfer amount was received through `PATCH /api/v1/owner/subscriptions/:id/renewal-payment`.
- If payment is confirmed, the renewal activates. If the current subscription is still active, the new period begins at the existing expiry date, preserving remaining days. If payment is not confirmed, the renewal request is rejected so the doctor can submit a corrected request.
- No automatic charge or automatic renewal is introduced.

Migration: `1733300000000-SubscriptionRenewalWithoutReapproval.ts` adds `requiresOwnerApproval`; existing active/expired records are marked as previously approved.

## 4) Existing V46 metadata repair

The TypeORM CLI data source now explicitly imports the V46 message mute/report entities. V46 entities were already included in the entity list but their imports were missing from `src/database/data-source.ts`; this would otherwise prevent the CLI data source from loading reliably.

## 5) Environment and release checklist

1. Add SMTP/SMS/Firebase secrets to the deployment environment, not the repository.
2. Run migrations, including `1733200000000-MessageSafetyAndMute` if not already applied and `1733300000000-SubscriptionRenewalWithoutReapproval`.
3. Install backend dependencies (includes `nodemailer`) and mobile dependencies (includes `expo-device` and `expo-notifications`).
4. Configure provider-specific SMS contract and credentials.
5. Test email and SMS OTP delivery using real test accounts/numbers.
6. Build a native Android development build with Firebase configuration and test push on a physical Android device; leave iOS push disabled until its APNs/Expo adapter is implemented.
7. Test first subscription approval, subsequent renewal, rejected payment verification, and renewal while an existing subscription still has days remaining against a real PostgreSQL test database.

No real SMS vendor credentials, SMTP credentials, Firebase service account, APNs key, or production database were available in this work session. Therefore external delivery is implemented as configurable adapters, not claimed as live-delivered or production-verified.
