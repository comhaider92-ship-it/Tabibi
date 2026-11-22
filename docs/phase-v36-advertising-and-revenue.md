# V36 — Advertising management and revenue tracking

## Scope
- Owner-only advertisement management with draft, active, paused and ended states.
- Advertiser, title, optional description/image/target URL, placement, schedule, agreed price, collected amount and payment reference.
- Public active-ad feed filtered by placement (`home` or `search`) and bounded by the configured start/end timestamps.
- Impression and click counters for active ads.
- Owner report for ad count, active count, contracted revenue, collected revenue, outstanding balance, impressions and clicks.
- Owner audit-log entries for ad creation and updates.
- Arabic mobile owner screen to create/manage ads and review financial metrics.
- Ad cards in the patient home screen and search screen.

## API
- `GET /api/v1/ads?placement=home|search` — public active ads.
- `POST /api/v1/ads/:id/impression` — record a valid active impression.
- `POST /api/v1/ads/:id/click` — record a valid active click.
- `GET /api/v1/owner/ads` — owner list.
- `GET /api/v1/owner/ads/report` — owner financial/performance report.
- `POST /api/v1/owner/ads` — create draft.
- `PATCH /api/v1/owner/ads/:id` — update ad or change its state.

## Database
Run migration `1732900000000-CreateAdvertisements` before using V36. The migration has been added to the project but has not been applied to a live database.

## Financial handling
Amounts are recorded in IQD. `priceIqd` is the agreed contract amount and `paidAmountIqd` is the amount manually confirmed as collected by the owner. No online ad payment gateway, automatic billing, or automatic collection is implemented. Outstanding is calculated as `max(0, contracted - collected)`.

## Limitations
- Image and target links are URL fields; direct media upload and advertiser self-service are not included.
- Impressions/clicks are client-reported counters and do not yet include fraud filtering, deduplication, or analytics by date/device.
- Ads only render in the patient home and search screens in this phase.
- No APK, production build, database integration test, or physical Android device test was performed.
