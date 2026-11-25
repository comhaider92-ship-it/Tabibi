# V104 — Database migration compatibility audit

## Finding
Several schema migrations used `uuid_generate_v4()` as a PostgreSQL column default, while the initial migration only enables `pgcrypto` and the deployment template uses PostgreSQL 16. The initial migration does not install the `uuid-ossp` extension, so a fresh database could fail when applying the later secure-upload and medical-record migrations.

## Change
- Standardized UUID column defaults in the affected migrations to PostgreSQL's built-in `gen_random_uuid()`.
- Kept the existing `pgcrypto` extension setup in the initial migration for compatibility with the existing schema baseline.
- Kept TypeORM `synchronize` disabled; schema changes remain explicit migrations.
- Kept migration execution as an explicit operator action. Do not run migrations against production before a verified database backup.

## Verification
Run `python scripts_verify_v104.py` for focused source-level checks. This does not replace applying the complete migration chain to a disposable PostgreSQL 16 database and validating the resulting schema.

## Remaining deployment gate
A real PostgreSQL migration rehearsal is still required. Dependency-backed Nest compilation and Android type-check/build also remain unverified until a network-enabled build environment is available.
