# Phase V18 — Mobile push registration and appointment reminders

## Included
- Authenticated device-token registration and deactivation for Android, iOS and web clients.
- Per-account preferences for push and appointment reminders (enabled by default).
- Firebase Cloud Messaging adapter configured through `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Durable reminder queue with 24-hour and 2-hour reminders for the beneficiary and booking account.
- Reminders are created in the same database transaction as the appointment; reminders are suppressed after cancellation, completion or no-show.
- A once-per-minute worker claims due rows with PostgreSQL `FOR UPDATE SKIP LOCKED`, so multiple backend instances do not claim the same reminder simultaneously.
- Retry handling and deactivation of invalid FCM tokens.

## API
- `POST /notifications/devices` — `{ "token": "...", "platform": "android|ios|web" }`
- `DELETE /notifications/devices/:id` — deactivate a device owned by the authenticated account.
- `GET /notifications/preferences`
- `POST /notifications/preferences` — `{ "pushEnabled": true, "remindersEnabled": true }`

## Deployment
1. Install dependencies with `npm install` (includes `@nestjs/schedule` and `firebase-admin`).
2. Configure `FIREBASE_SERVICE_ACCOUNT_JSON` with the Firebase service-account JSON as a single environment value.
3. Run database migrations using `npm run migration:run`.
4. The mobile clients must request OS notification permission and register their current FCM token with `POST /notifications/devices`. Refresh the token registration whenever Firebase rotates it.
5. Ensure the app is configured for Firebase Cloud Messaging and Android notification channel `tabibi_appointments` exists in the client.

If Firebase credentials are absent, the API remains usable and in-app notifications continue to work, but the push worker stays disabled. Reminders are generated only for send-times that are still in the future at booking time. A missing device token or disabled preference skips delivery rather than sending to another account.

## Operational notes
- Use HTTPS and protect the Firebase service-account secret; never ship it in the mobile app.
- This phase sends scheduled reminder pushes. Existing booking/status notifications remain persisted in the in-app notification inbox; immediate push fan-out for every inbox event can be added as a separate outbox delivery phase.
- Verify delivery on real Android/iOS devices after configuring Firebase. Static checks do not establish real FCM delivery.
