# V49 – Owner operations dashboard and review queue

## Delivered
- Renamed the owner landing screen to clearly represent owner-level administration rather than implying it is only a facility dashboard.
- Added a consolidated operational review queue with counts for pending doctor profiles, pending facility approvals, pending subscription requests, pending booking-message reports, and unread owner notifications.
- Added direct navigation actions from the queue to the existing doctor/facility review, subscription review, and message-report screens.
- Queue sources use existing owner-authorized API endpoints; no new backend route or database migration was needed.
- Each queue source is isolated with a fallback so a temporary failure in one list does not prevent the remaining dashboard data from loading.
- Refreshing the owner dashboard now refreshes both facility data and the operational review queue.

## Verification limits
- Static source checks and TypeScript/TSX syntax transpilation only.
- No full NestJS build, Expo bundle, Android APK, or live database/API integration test was run.
