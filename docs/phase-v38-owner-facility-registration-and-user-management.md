# V38 — Owner facility registration and user management

## Included
- Added an Arabic owner screen to register hospitals, laboratories, radiology centers, diagnostic centers, and imaging centers.
- Registration uses the existing authenticated `POST /api/v1/facilities` endpoint. The server assigns the logged-in owner and creates the facility in `pending` status.
- The owner is routed to the existing review queue after submission. Pending facilities remain hidden from the public directory and from linked-ad target choices until approved.
- Added owner account management with filters for all users, patients, doctors, and owners.
- Owner can activate/deactivate non-owner accounts. The backend already blocks deactivation of owner accounts and records changes in the owner audit log.
- Added both screens to the owner dashboard and navigation.

## Existing behavior preserved
- No new database migration is required.
- Existing doctor/facility review flow and approval requirements remain unchanged.
- Facility records remain scoped to the authenticated owner for owner facility operations.
- No automatic subscription renewal or patient fees were introduced.

## Verification
Run `python scripts_verify_v38.py` for the V38 static checks. Existing phase verification scripts are retained and should be run as a regression suite.

This phase has not been built against installed dependencies, run against a live database, bundled by Expo, or tested on a physical Android device. Those checks require dependency installation and runtime configuration.
