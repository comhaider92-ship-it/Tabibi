# V102 — Authorization regression audit

V102 adds a focused, repeatable static regression suite for the application's main account and data-access boundaries. It does not change runtime authorization behavior or database schema.

## Covered boundaries

- Public registration accepts only the patient role; the service assigns that role server-side.
- Authenticated sessions require an active account, matching token version, a non-revoked session, and an unexpired session.
- Role metadata is enforced by the shared role guard.
- Patient medical-record queries are scoped to the authenticated patient. Doctor medical-record access is scoped to the doctor's own appointment or an active patient sharing consent; structured-record access also requires an approved doctor profile. The owner role is denied clinical-record access.
- Private uploads require authentication. Public upload delivery is limited to the currently selected, approved doctor/facility profile image. Medical attachment download requires a live consent with `allowDownload` and remains access-logged.
- Patient appointment lists are scoped to the booking account or registered beneficiary; doctor lists are scoped to the doctor. Appointment detail rejects unrelated accounts.
- Owner advertisement management remains owner-only.

## Verification

Run from the backend project root:

```bash
python scripts_verify_v102.py
```

Expected result: 18/18 static checks pass.

## Scope and limitations

These are source-level regression checks, not a substitute for integration tests against PostgreSQL or penetration testing. The checks confirm the presence of key guards and scoping predicates; they do not prove every runtime path, query plan, or deployment configuration is secure. Full TypeScript build and API integration tests still require installed dependencies and a configured PostgreSQL environment. Run `npm ci`, `npm run build`, and the database-backed test suite in the connected build environment before deployment.

Public endpoints intentionally retained include the public doctor/facility directories, approved profile images, public advertisements, and privacy-limited document verification endpoints.
