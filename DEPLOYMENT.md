# TABIBI self-hosted deployment starter

This is a **deployment template**, not a claim that TABIBI has been deployed or production-certified.

## Prerequisites

- A Linux host with Docker Engine and the Docker Compose plugin.
- A domain name and HTTPS reverse proxy (for example, Caddy or Nginx) before exposing the API publicly.
- A strong, unique database password and a randomly generated `JWT_SECRET` of at least 32 characters.

## Configure

1. Copy `.env.example` to `.env`.
2. Fill in every required value. Do not commit `.env` or share it in chat.
3. Set `DATABASE_HOST` to `db` and `DATABASE_PORT` to `5432` for this Compose setup.
4. Set `PUBLIC_API_BASE_URL` to the public HTTPS origin plus `/api/v1` once HTTPS routing is configured.
   The API refuses to generate prescription or clinical-report verification QR codes if this value is missing, malformed, local-only, or non-HTTPS in production.
5. Keep `API_PORT` bound to localhost as in `compose.yaml`; terminate HTTPS at the reverse proxy.

## Start and migrate

```sh
docker compose up -d --build
docker compose ps
```

Compose starts PostgreSQL, waits for its health check, runs the one-shot `migrate` service, and only then starts the API. If the migration service exits unsuccessfully, the API will not start. Review migration output and take a verified backup before updating an existing production database.

The API health check uses `/api/v1/health/ready`, which verifies database reachability. Do not run migrations against a production database until you have a verified backup and have reviewed the migration plan.

## Android preview

After the API is reachable over HTTPS, set `EXPO_PUBLIC_API_URL` in the mobile build environment to the full URL ending in `/api/v1`, then run the existing checked preview build from `mobile/`:

```sh
npm run check:build-config
npm run build:android:preview:checked
```

A reproducible Android debug-APK workflow is available in GitHub Actions (`TABIBI V129 Android test APK`). It currently embeds a deliberately unreachable CI-only API address and is only for installation/UI smoke testing; it is not a usable connected app. A real preview/release APK must be rebuilt after the deployed HTTPS API URL is known.

## Important operational limits

- Compose here is a starting point for a single-host deployment, not a high-availability setup.
- Configure automated encrypted PostgreSQL backups and test restores before real patient data is stored.
- Protect `.env`, Firebase and SMTP credentials, and the JWT secret. Rotate any credential that has been exposed.
- The named upload volume contains private medical documents; back it up securely and restrict host access.
- Put the API behind HTTPS, configure firewall rules, monitoring, log retention, and an incident-response process before production use.
- The backend Docker build uses the committed root `package-lock.json` with `npm ci`; keep `package.json` and the lockfile in sync and review lockfile updates.

## Migration preflight (V105)

Before applying migrations to a new or existing database, run the static migration audit and inspect TypeORM's pending migration list:

```sh
npm run check:migrations
npm run migration:show
```

The audit checks migration filename timestamps, ordering, class names, reversible `up`/`down` methods, UUID extension ordering, and the disabled ORM schema synchronization setting. `migration:show` requires installed dependencies and a reachable database. On a new database, take a verified backup when applicable, confirm the target database and credentials, inspect the pending list, then run `npm run migration:run`. Do not treat the static audit as a substitute for applying migrations against a real PostgreSQL 16 instance and testing a restore.

## V106 production checks

Before starting the API with `NODE_ENV=production`, provide all of the following: `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_NAME`, `DATABASE_PASSWORD` (at least 16 characters), an absolute private `UPLOADS_DIRECTORY`, and `PUBLIC_API_BASE_URL` using HTTPS and ending in `/api/v1`. `JWT_SECRET` must be a unique random value of at least 32 characters. `PORT` must be an integer from 1 through 65535.

## V107 production owner bootstrap safeguards

For production startup, `OWNER_EMAIL` and `OWNER_PASSWORD` are mandatory because the API creates the initial sole-owner account when it does not already exist. The email must be a real address (not an example placeholder); the bootstrap password must be unique, at least 14 characters, and not a common/default placeholder. `DATABASE_PASSWORD` must also be unique, at least 16 characters, and not a common/default placeholder. These checks run before NestJS initializes the database connection. Store these values only in the deployment secret manager or protected `.env`; after first successful owner login, change the bootstrap password through the account's password-change flow and rotate the deployment secret in a coordinated maintenance window.

The V107 checks are static source checks. They do not prove a production database, owner bootstrap, Docker image, or Android APK has been executed. Those require a real PostgreSQL 16 service and an HTTPS deployment endpoint.


## Render deployment (V129)

A Render Blueprint is provided in `render.yaml`. It creates a Frankfurt Docker web service, managed PostgreSQL 16, a private persistent upload disk, runs `npm run migration:run` before each deployment, and checks `/api/v1/health/ready`. The API derives its public HTTPS base URL from Render's assigned service URL.

To deploy, connect the GitHub repository to Render and create a Blueprint from branch `v129-deployment-readiness-trial`. During initial setup, provide the owner email/password and SMTP credentials in Render's secret prompts; never place them in GitHub or chat. SMTP is needed for email OTP. Phone OTP additionally requires an SMS provider configured through `SMS_API_URL`, `SMS_API_TOKEN`, and `SMS_SENDER_ID`. Push delivery additionally requires Firebase credentials.

The blueprint uses the smallest paid Render web and PostgreSQL plans plus a 1 GB persistent upload disk. Current listed starting costs are approximately $7/month for the web service, $6/month for PostgreSQL, and $0.25/month for the disk, before bandwidth, taxes, or email/SMS provider charges. The free PostgreSQL instance expires after 30 days, so it is not selected for this deployment. Review the live pricing before confirming any paid resources.

Do not store real patient records until production backups and restore testing, access controls, monitoring, and applicable privacy/security obligations have been reviewed. A successful Render deployment is still not a substitute for clinical workflow acceptance testing.
