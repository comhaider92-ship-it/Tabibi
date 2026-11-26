# Tabibi — Authorization regression checklist

Status: planned regression tests, not executed.

## Authentication and registration
- [ ] Generic registration accepts patient role only; reject doctor/owner role requests.
- [ ] New patient cannot login until account verification is complete.
- [ ] Owner account is provisioned only through server configuration/bootstrap; public registration cannot create or promote an owner.
- [ ] Login failures are throttled per identifier and IP.

## API role isolation
- [ ] Patient JWT denied from every doctor profile management endpoint.
- [ ] Patient JWT denied from all owner review, facility approval, subscription administration, ad administration, finance, user management and audit endpoints.
- [ ] Doctor JWT denied from all owner endpoints.
- [ ] Owner JWT is accepted only for owner-specific endpoints.
- [ ] Tampering with client role/profile status does not grant privileges; API derives authority from validated token and database state.

## Doctor eligibility and visibility
- [ ] Pending/rejected doctor profile is excluded from public directory.
- [ ] Only owner-authorized review can approve or reject an application.
- [ ] Approved doctor without active subscription cannot accept new bookings.
- [ ] Expired subscription disables new bookings while profile visibility follows product policy.
- [ ] Credential documents are private and inaccessible via public URLs.

## Mobile navigation and session handling
- [ ] Role-specific screens render based on authenticated server user, not locally chosen role.
- [ ] On logout, token and push-device registration are cleared.
- [ ] Account switching returns to login and obtains a fresh authenticated role.
- [ ] Deep links/navigation cannot bypass API authorization.

## Execution notes
Run tests against a disposable test environment with seeded patient, doctor, pending doctor, approved doctor, and owner accounts. Record test results, commit SHA, environment, and failures. Do not mark any item passed without executing it.
