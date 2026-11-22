# V93 — Android build configuration readiness

## Purpose

V93 adds a pre-build gate for the existing Expo EAS Android profiles. It prevents creating a phone APK with a missing, placeholder, emulator-only, or malformed API address.

## Required API address

Set `EXPO_PUBLIC_API_URL` in the build environment to the backend address reachable by the physical phone, including `/api/v1`.

Examples:

- Preview on a physical phone: `https://<your-preview-api-domain>/api/v1`
- Production: `https://<your-production-api-domain>/api/v1`

Do not use `localhost`, `127.0.0.1`, `0.0.0.0`, or Android emulator host `10.0.2.2` in a build intended for a physical phone. Do not put database credentials, JWT secrets, SMTP credentials, or service-account keys in `EXPO_PUBLIC_*` variables; Expo embeds these values in the client app.

## Commands

From the `mobile/` directory:

```sh
EXPO_PUBLIC_API_URL=https://<your-preview-api-domain>/api/v1 npm run check:build-config
EXPO_PUBLIC_API_URL=https://<your-preview-api-domain>/api/v1 npm run build:android:preview:checked
```

For production, use an HTTPS production API address and `npm run check:build-config:production` before the production build.

## What this phase verifies

- A valid API URL is supplied at build time.
- The URL is suitable for a physical phone and includes `/api/v1`.
- Production builds use HTTPS.
- The Android package identifier and selected EAS artifact profile exist.

## What remains external

This phase does not deploy the backend or PostgreSQL database, create a public API domain, configure TLS, create an EAS account/project, install npm dependencies, or produce an APK. Those require deployment credentials/services and an authenticated EAS build environment. A successful configuration check is not a successful Android build or device test.
