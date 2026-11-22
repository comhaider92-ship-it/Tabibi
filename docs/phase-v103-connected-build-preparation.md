# V103 — Connected build preparation

V103 prepares a repeatable path for dependency-backed builds without claiming that a build has passed in an offline/source-only workspace.

## Findings from V102

- Backend and mobile each declare dependencies in `package.json`.
- Neither project includes an npm lockfile.
- Neither project has an installed `node_modules` directory in the supplied workspace.
- The backend has a Nest build command; the mobile app has a TypeScript check and Expo/EAS Android profiles.
- The mobile preview configuration requires `EXPO_PUBLIC_API_URL` pointing to a reachable API URL ending in `/api/v1`; production requires HTTPS.

## Added in V103

- `scripts/check-build-readiness.mjs` reports lockfile, dependency-installation, and API URL readiness without pretending to run a build.
- `scripts/prepare-connected-build.sh` creates missing npm lockfiles in a network-enabled environment, installs with `npm ci`, runs the backend build, runs the mobile TypeScript check, and validates Expo configuration. If `EXPO_PUBLIC_API_URL` is supplied, it also runs the Android preview configuration check.
- Root npm script: `npm run check:build-readiness`.

## Run in a network-enabled build environment

From the repository root:

```sh
./scripts/prepare-connected-build.sh
```

Review and commit both generated lockfiles after confirming their contents. The script does not deploy PostgreSQL or the API and does not create an APK. Android APK generation still requires a reachable HTTPS backend, EAS CLI/account access, and a configured build environment.

## Verification status in the current workspace

The package registry lookup failed with DNS resolution error `EAI_AGAIN registry.npmjs.org`; the npm cache is empty and no dependency directories or lockfiles are present. Therefore dependency installation, Nest compilation, Expo type-checking, and Android packaging could not be run here. This is an environment limitation, not a successful build result.
