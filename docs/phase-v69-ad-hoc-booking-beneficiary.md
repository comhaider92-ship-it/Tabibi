# V69 — Ad-hoc booking for self or another person

## Product decision
- Removed the patient feature for saving, listing, editing, or deleting family members / beneficiaries.
- Patient chooses who the booking is for: self or another person.
- For another person, the patient enters the person's name and optional phone details during that booking only.
- No saved beneficiary contacts are offered or reused across bookings.
- Self-booking and guest booking continue to preserve the authenticated booking account (`bookedByUserId`) and existing cancellation/messaging permissions.
- For doctor bookings, self uses the signed-in patient beneficiary ID; another person uses `beneficiaryName` and optional `beneficiaryPhone`.
- For facility bookings, the existing patient name and optional phone fields are populated from the selected self/other choice.
- Existing booking records retain their copied beneficiary details.
- A forward migration drops the V68 `patient_beneficiaries` table; historical migration source remains for migration history.
- No changes to day-only booking, queue removal, booking status lifecycle, or ordinary booking notifications.

## Verification
- V69 source-contract checks cover removal of saved-beneficiary UI/API/backend and preservation of self/guest booking.
