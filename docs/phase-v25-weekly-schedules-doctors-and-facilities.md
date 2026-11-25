# V25 – Weekly schedules for doctors and diagnostic facilities

## Shared weekly schedule model

`weekly_schedule_rules` stores recurring weekly work periods for both owner types. Each rule has a weekday (`0=Sunday` through `6=Saturday`), local start/end time, timezone (defaults to `Asia/Baghdad`), and zero or more break periods. Validation rejects invalid time ranges, overlapping breaks, breaks outside working hours, and overlapping periods on the same weekday. One timezone is used per owner's weekly schedule.

## Doctors

- `GET /api/v1/doctors/me/weekly-schedule` – authenticated doctor reads their weekly work periods.
- `POST /api/v1/doctors/me/weekly-schedule` – authenticated doctor saves/replaces their weekly periods and breaks.
- Existing `POST /api/v1/doctors/me/availability-slots` remains the way to publish actual bookable appointments. There is deliberately no fixed consultation duration: the doctor continues to add appointment slots individually, preserving the V13 decision.
- Once a doctor has a weekly schedule, newly published slots must fit within a working period and must not overlap a break. If no weekly schedule exists yet, legacy slot entry remains supported.

Example:
```json
{
  "rules": [
    {"weekday":0,"startTime":"09:00","endTime":"14:00","breaks":[{"startTime":"11:00","endTime":"11:30"}],"timezone":"Asia/Baghdad"},
    {"weekday":2,"startTime":"16:00","endTime":"20:00","breaks":[],"timezone":"Asia/Baghdad"}
  ]
}
```

## Facilities and labs

- `POST /api/v1/facilities/owner/:id/services/:serviceId/weekly-schedule` – owner saves weekly hours/breaks for a specific service (e.g. MRI or laboratory analysis).
- `GET /api/v1/facilities/:id/weekly-schedule?serviceId=...` – public view of a facility's weekly schedule.
- `POST /api/v1/facilities/owner/:id/services/:serviceId/generate-slots` with `{ "from":"YYYY-MM-DD", "to":"YYYY-MM-DD" }` – materializes up to 31 days of bookable slots using that service's configured expected duration. Slots overlapping breaks are skipped; past and duplicate slots are skipped.
- Existing manual facility slot creation remains available for exceptional one-off openings.

## Notes and safeguards

- Facility schedule generation is per service because MRI, ultrasound, X-ray, and lab services can have different expected durations.
- The doctor's schedule is a work-hours framework, not a forced appointment duration or an automatic fixed-length slot generator.
- Owner/doctor authentication and ownership checks are applied to write operations.
- Run migration `1732500000000-CreateWeeklySchedulesForDoctorsAndFacilities` before using the new endpoints.
- Static source checks do not replace TypeScript build and PostgreSQL integration tests. Run the project build and migrations in the deployment environment before release.
