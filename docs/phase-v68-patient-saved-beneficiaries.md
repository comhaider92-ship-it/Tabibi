# V68 — Patient saved beneficiaries

## Purpose
Allow a patient account to save people they commonly book for, then reuse the saved name and optional phone number when booking a doctor or facility. A saved beneficiary does not need a Tabibi account.

## Backend
- New `patient_beneficiaries` table with owner user FK (`ON DELETE CASCADE`), display name, optional phone and optional relationship.
- Patient-only authenticated API: `GET/POST /patient/beneficiaries`, `PATCH/DELETE /patient/beneficiaries/:id`.
- Every list/update/delete is scoped by the authenticated owner user ID. No endpoint accepts an owner ID from the client.
- Maximum 50 saved beneficiaries per patient.
- DTO limits: name 120, phone 32, relationship 40 characters.
- Migration: `1733700000000-CreatePatientBeneficiaries.ts`.

## Mobile
- New patient home shortcut and Beneficiaries screen to add, edit and delete saved people.
- Booking screen loads saved people and lets the patient select one. The saved name/phone are copied into the existing doctor or facility booking request.
- Existing self-booking and manual guest-beneficiary flows remain available.
- Deleting a saved beneficiary only removes the reusable contact card; existing bookings keep their own copied beneficiary details.

## Privacy and boundaries
- Saved beneficiary records are private to the patient account that created them.
- They are not user accounts, do not have credentials, and cannot log in.
- No medical record, diagnosis, test result, or independent family-member account is introduced in this phase.
- This feature does not change day-only booking, booking status, queue policy, notifications, or provider schedule/capacity rules.
