# V63 — Day-only patient booking

## Product rule
Patients choose a calendar day only. The patient-facing booking flow never asks for or displays an attendance hour. The chosen day is the commitment; delays caused by a doctor examining a previous patient, patient arrival, or laboratory workload do not make the booking late or missed.

## Implementation
- Patient booking groups provider-generated capacity slots by Baghdad calendar day (`Asia/Baghdad`) and presents one selectable row per day.
- The app silently assigns the earliest still-available internal capacity slot for that day. This preserves existing doctor/facility capacity, collision protection, provider schedules, and service durations without presenting that slot as the patient's appointment hour.
- Patient booking confirmation, booking list, doctor dashboard, and owner facility booking list display the day, not the internal slot time.
- Cancellation remains available until the start of the selected Baghdad day; it is no longer blocked merely because the hidden internal capacity slot time passed.
- A doctor may mark a visit completed from the beginning of the selected day. `no_show` is blocked by the server until the entire Baghdad day has ended; the mobile action follows the same rule.
- Clock-time patient reminders for doctor appointments are no longer scheduled because a precise attendance hour is not part of the booking promise.

## Important distinction
Internal provider availability slots remain part of capacity planning and are managed by doctors/facilities. They are not shown as a required attendance time to patients. One day can accept as many bookings as there are remaining internal capacity slots for that day.

## Verification boundaries
Source-contract tests and TypeScript/TSX syntax transpilation are run for this phase. No live PostgreSQL integration, NestJS full build, Expo bundle, APK, SMS/push delivery, or real-device test is claimed.
