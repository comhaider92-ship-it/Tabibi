# Tabibi — Next implementation priorities (26 Nov 2026)

## Navigation and access control
- Keep account switching inside the app: role changes rebuild the navigation stack; logout clears tokens and push-device registration.
- The UI is not the security boundary. Verify patient/doctor/owner authorization on every protected server endpoint.
- Patient registration must remain patient-only; doctor onboarding requires a dedicated guarded workflow; owner accounts must never be created through public registration.

## Provider and owner usability
- Doctor profile: distinguish draft, submitted, approved and rejected states; display review feedback; make save and submit actions clear.
- Owner: test each dashboard shortcut against its destination and API; show queue counts and errors rather than blank screens.
- Facilities and subscriptions: review/approval actions should confirm outcome and refresh the queue.

## Release gates
- Typecheck and Android preview build.
- Verify role isolation with separate patient, doctor and owner accounts.
- Verify navigation switching/logout, deep links and notifications.
- Verify real API URL, OTP delivery, secure storage, and server authorization.
- Publish an installable preview only after build succeeds.

## Current limitation
The branch has recent homepage source changes and an HTML demo preview, but neither the phone runtime nor a live Pages deployment is verified in this workspace.