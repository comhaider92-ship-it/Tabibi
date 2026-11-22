# Phase V22 — Name-based patient search

## Patient search experience
- Patient-facing examples: search by **اسم الطبيب** or **اسم المختبر** directly.
- The patient can use one simple search field before booking instead of being forced to choose a category first.
- Doctor search accepts `q` and matches the approved doctor's full name, specialty, sub-specialty, and clinic name. The existing `name` query parameter remains supported for backward compatibility.
- Facility search accepts `q` and matches either the approved facility's registered name or the name of an active service offered by that facility. This allows patients to type a laboratory/center name or a test name such as MRI, ultrasound, or CT.
- Facility search also supports explicit `name`, `serviceName`, `city`, and `type` filters. Results remain restricted to approved facilities, and inactive services are not considered matches.

## Endpoints
- `GET /api/v1/doctors?q=د. أحمد&city=Basra`
- `GET /api/v1/doctors?q=أطفال&specialty=الأطفال`
- `GET /api/v1/facilities?q=مختبر النور&city=Basra`
- `GET /api/v1/facilities?q=رنين مغناطيسي&type=imaging`
- `GET /api/v1/facilities?name=مركز النور&serviceName=سونار`

The `q` parameter is intended for the single prominent search box in the patient app. Category chips and filters can remain optional refinements, not prerequisites.

## Compatibility and safety
- Existing doctor `name` filtering and facility `city`/`type` filtering remain compatible.
- Only approved doctors and facilities are exposed through public directories.
- Facility name/service matching joins active services only and returns each facility once.
- Doctor static routes are ordered before the UUID detail route to prevent `/me/profile` from being interpreted as a doctor UUID.

## Verification
Run `python3 scripts_verify_v20.py`, `python3 scripts_verify_v21.py`, and `python3 scripts_verify_v22.py`. These are static source checks, not a TypeScript build or live database/API test. Full build and integration checks require installed dependencies and a configured database.
