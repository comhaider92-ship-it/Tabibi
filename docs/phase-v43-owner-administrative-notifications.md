# V43 – Owner administrative notifications

## Delivered
- Added owner-only notification event types for pending doctor profile reviews and new doctor subscription requests.
- Added `NotificationsService.notifyOwners`, which targets active OWNER accounts and persists notifications through the existing in-app/push dispatch pipeline.
- Notification dispatch failures are logged and swallowed so they cannot turn a successfully saved doctor profile or subscription request into an apparent failure.
- Doctor profile submission alerts the owner once when the profile transitions into `pending`; resubmitting an already-pending profile does not create duplicate alerts.
- New doctor subscription requests alert the owner with the subscription and doctor identifiers.
- Owner notification actions can open the doctor review queue or subscription management screen directly. Opening an alert marks it as read first.
- Existing facility/doctor booking notifications and notification center remain unchanged.

## Notes and limits
- Facility creation and advertisement creation are owner-initiated workflows, so they do not generate redundant notifications back to the same owner.
- Push delivery remains conditional on Firebase configuration and registered device tokens. In-app notifications are persisted independently.
- No database migration is required: notification `type` is stored as a varchar and the new values fit the existing column.
- Static checks do not replace a full NestJS build, Expo bundle, APK build, or live database/device test.
