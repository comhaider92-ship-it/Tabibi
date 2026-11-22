# Phase V35 — Owner administration and manual doctor subscriptions

## Delivered
- Added `doctor_subscriptions` with pending/active/rejected/expired states, requested duration and IQD amount, transfer reference, optional proof URL, review note, reviewer, start and expiry timestamps.
- Doctors can submit a manual subscription request and review their own request history/status.
- Owners can view subscription requests, approve/reject them, set the approved duration, browse doctor accounts, activate/deactivate non-owner accounts, and inspect an owner dashboard summary.
- Subscription activation begins at the moment of owner approval. No automatic renewal or automatic payment capture is implemented.
- Expired subscriptions are marked expired on owner listing/summary and doctor status reads.
- Doctor profiles remain in the public directory based on profile approval, independent of subscription status. Creating a new doctor appointment requires an active subscription whose expiry is in the future.
- Added owner audit logs for doctor-profile decisions, facility decisions, subscription decisions, and user activation/deactivation.
- Added Arabic mobile screens for doctor subscription requests and owner administration; wired navigation from the doctor and owner dashboards.

## API
- `POST /api/v1/doctors/me/subscriptions`
- `GET /api/v1/doctors/me/subscriptions`
- `GET /api/v1/doctors/me/subscription-status`
- `GET /api/v1/owner/summary`
- `GET /api/v1/owner/subscriptions?status=pending|active|rejected|expired`
- `PATCH /api/v1/owner/subscriptions/:id/review`
- `GET /api/v1/owner/users?role=doctor|patient|owner`
- `PATCH /api/v1/owner/users/:id/status`
- `GET /api/v1/owner/audit-logs`

## Migration
- New migration: `1732800000000-CreateDoctorSubscriptionsAndOwnerAudit.ts`.
- Run the normal TypeORM migration command before using V35 endpoints. Migration has not been applied to any live database by this delivery.

## Important boundaries
- Proof of transfer is currently a manually supplied reference or URL. Secure in-app file upload and MasterCard/payment-gateway integration are not included.
- The owner manually verifies the transfer and approves the request.
- No automatic renewal is performed.
- Subscription revenue in the dashboard is a sum of recorded approved subscription amounts, not a bank reconciliation or audited cash balance.
- Static checks and TypeScript syntax transpilation do not replace a full backend build, database integration tests, or a real Android device test. Dependencies/database were not provisioned in this workspace.
