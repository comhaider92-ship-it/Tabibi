# Phase V20 — Doctor directory search and public profiles

V20 upgrades `GET /api/v1/doctors` into a paginated public directory and adds `GET /api/v1/doctors/:id` for an approved doctor's public profile.

## Search filters

- `name`: partial match against the doctor's displayed name.
- `specialty`: partial match against the main specialty.
- `subSpecialty`: partial match against the precise/sub-specialty.
- `city`: city/governorate filter only.
- `minRating`: minimum average of published ratings, from 0 to 5.

There is deliberately **no area/district filter**. The directory returns approved doctors only; draft, pending, and rejected profiles never appear publicly.

## Sorting and pagination

- `sort=name|rating|experience|newest`; default `name`.
- `order=ASC|DESC`; default `ASC`.
- `page` is zero-based; default `0`.
- `limit` defaults to `20`, maximum `50`.

Example:

```http
GET /api/v1/doctors?city=Basra&specialty=Cardiology&subSpecialty=Interventional&minRating=4&sort=rating&order=DESC&page=0&limit=20
```

The response contains `items` and pagination metadata (`page`, `limit`, `total`, `pages`). Each item exposes public profile fields and the average/count of published ratings only. Internal review fields, doctor account IDs, and hidden/under-review ratings are not returned.

## Public doctor details

```http
GET /api/v1/doctors/{profileId}
```

Returns the approved public profile, overall published-rating average/count, and up to 20 latest published rating entries. Non-approved or unknown profiles return 404.

## Database

Run migration `1732100000000-AddDoctorDirectoryIndexes` after V19 to add indexes supporting city/name and sub-specialty directory queries. No existing data is removed.

## Static verification

Run:

```bash
python scripts_verify_v20.py
```

The static checks do not replace a TypeScript build or PostgreSQL integration test; those remain deployment validation steps.
