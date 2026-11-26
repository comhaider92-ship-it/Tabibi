# Tabibi mobile role/navigation verification

This checklist supplements the release gates. Execute on a real Android device with the configured API before declaring readiness.

## Account boundary
- [ ] Patient login resolves the role from the server response; do not accept a role chosen by the client.
- [ ] Doctor login resolves only a doctor account and opens the doctor stack.
- [ ] Owner login resolves only an owner account and opens the owner stack.
- [ ] Patient public registration rejects role values other than patient at DTO/server level.
- [ ] Owner creation is restricted to deployment configuration/authorized provisioning, not public registration.
- [ ] A patient cannot call owner or doctor endpoints even if manually invoking requests.
- [ ] Logout clears token storage and unregisters the push device when possible.

## In-app role transition
- [ ] Header switch-account action returns to the login screen without closing the app.
- [ ] Navigation history from the previous role is not retained after logout.
- [ ] After signing in as another account, the previous role's screens are unavailable.
- [ ] Restore-token flow validates the session against /auth/me and clears invalid tokens.

## Registration and verification
- [ ] Patient registration is available from the login screen.
- [ ] Account verification requires a valid six-digit OTP.
- [ ] OTP resend limits and expiry are enforced by server.
- [ ] Login rejects unverified patient accounts.
- [ ] Password reset does not reveal whether an account exists.
- [ ] Verify SMS/email provider delivery in production configuration; server logs are not production delivery.

## Functional dashboard checks
- [ ] Doctor profile save and submit states.
- [ ] Doctor schedule CRUD and booking status updates.
- [ ] Owner approval/rejection for doctors and facilities.
- [ ] Owner subscription, renewal, ad, finance, facility, user, audit and message-report destinations.
- [ ] Refresh/error/empty states for every dashboard section.

## Build / deployment
- [ ] Configure a reachable HTTPS API base URL.
- [ ] Run mobile typecheck.
- [ ] Build EAS Android preview APK and install.
- [ ] Verify navigation and API flows on device.
- [ ] Confirm GitHub Pages preview deployment and URL before sharing it as live.

**Status:** checklist only; execution pending.