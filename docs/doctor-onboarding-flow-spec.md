# Doctor onboarding flow — implementation contract

## Goal
The single Tabibi mobile app offers separate patient and doctor onboarding choices, while owner account creation remains private and server-configured.

## Public registration boundary
- Existing `POST /auth/register` remains patient-only; never loosen its DTO to accept arbitrary roles.
- Proposed doctor signup must use a dedicated endpoint and DTO, not a client-supplied generic role.
- A doctor applicant account must be inactive for professional directory/booking privileges until owner approval.
- Credentials/qualification uploads must be private and scoped to applicant ownership; do not trust arbitrary URLs or client-provided approval/status values.

## Applicant experience
1. Choose `مريض` or `طبيب` on the app's welcome screen.
2. Doctor application collects full name, phone/email, password, specialty, city, clinic name, address and qualification document; optional experience, bio and photo remain optional.
3. Verify contact using existing OTP mechanism.
4. Create doctor-role account and draft/pending profile through server-controlled workflow.
5. Show application status (pending/rejected/approved) and owner review note when safe to disclose.
6. On approval, direct doctor to complete profile, subscription and schedule; booking activation remains subject to existing approval/subscription rules.

## Security invariants
- No public or mobile endpoint creates an owner.
- Applicant cannot set role, approval status, reviewer identity, subscription state or booking enablement.
- Owner routes are enforced server-side with JWT and roles guards.
- Doctor endpoints require doctor role; patient routes require patient role as appropriate.
- Qualification documents are not public; directory profile only publishes approved, intended fields.
- Use idempotency or duplicate-safe account creation, database unique constraints for contact fields, rate limits, and audit logs for review decisions.
- Do not expose existence of accounts through OTP responses.

## Acceptance tests before merging
- Patient signup rejects `role=doctor` and `role=owner` in generic registration.
- Dedicated applicant flow creates no owner, no approved profile, and no booking eligibility.
- OTP verification only verifies intended contact and cannot change applicant role/status.
- Patient token cannot access doctor dashboard/profile submission or owner review endpoints.
- Doctor token cannot access owner dashboard/review/subscription management endpoints.
- Owner token can review pending profile; decision audit is persisted.
- Directory and booking endpoints only expose approved doctors with required eligibility.
- OTP request throttling and verification attempt limits are tested.
- Mobile navigation transitions between role login flows without app-process termination.

## Current state
The source review confirms patient-only generic registration and guarded doctor/owner routes. The doctor-specific registration workflow remains a separate implementation task. This document is a contract, not evidence of runtime implementation or test success.
