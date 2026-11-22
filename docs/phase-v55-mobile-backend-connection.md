# V55 — Mobile / Backend connection readiness

## Scope
This phase addresses a critical deployment configuration issue found during review of the V54 source: the mobile API client silently defaulted to `http://localhost:3000/api/v1`. On a physical Android device, `localhost` points to the device itself, not the computer or deployed backend, so login and all API-backed screens would fail.

## Changes
- Removed the implicit localhost fallback from `mobile/src/api/client.ts`.
- Added early configuration validation with clear Arabic errors when the API URL is missing, malformed, uses an unsupported protocol, or points to localhost/loopback.
- Normalized trailing slashes to prevent accidental double slashes in API paths.
- Updated `mobile/.env.example` with distinct Android emulator, physical-device LAN, and production HTTPS examples.
- Kept the existing `/api/v1` backend prefix and existing API routes unchanged.

## Required deployment configuration
Set `EXPO_PUBLIC_API_URL` before running Expo or triggering an EAS build. Examples:
- Android emulator: `http://10.0.2.2:3000/api/v1` (development only).
- Physical Android device: `http://<computer-LAN-IP>:3000/api/v1` when both devices share a network and the backend is reachable.
- Production: `https://<your-api-domain>/api/v1`.

Do not ship a production build with a private LAN address or emulator-only address. Ensure DNS, TLS, reverse proxy, firewall, and backend availability are configured before release.

## Verification boundaries
The source-contract test checks the absence of a localhost fallback and the presence of configuration validation. It does not perform a live network request, authenticate against a running backend, validate deployment DNS/TLS, or build an APK. The project archive still does not include installed dependencies or a configured live backend.
