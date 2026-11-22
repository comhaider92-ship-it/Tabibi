# V54 — Android APK build readiness

## Scope
This phase prepares the existing Expo mobile app for a distributable Android APK without changing booking, subscription, messaging, or account behavior.

## Changes
- Added `mobile/eas.json` with an internal `preview` profile that requests an Android APK and a `production` profile that requests an Android App Bundle (AAB).
- Added npm scripts `build:android:preview` and `build:android:production`.
- Added Android `versionCode: 1` to the existing Expo config.
- Preserved the existing app name (`طبيبي`), slug (`tabibi`), version (`1.0.0`), Android package ID (`iq.tabibi.app`), iOS bundle ID, and SecureStore/Notifications plugins.
- Added `scripts_verify_v54.py` for static configuration regression checks.

## Environment inspection
The supplied build environment has Node.js and npm, but no `eas` CLI, Java, Gradle, Android SDK, or ADB executable. Neither root nor mobile `node_modules` is present. Consequently, a local native Android build and device installation cannot be performed here. No APK is included and no build is claimed as successful.

## How to produce the test APK
From the `mobile` directory on a machine with Node.js/npm and an EAS account:

1. Run `npm install`.
2. Install or invoke the EAS CLI and sign in (`eas login`).
3. Run `eas build --platform android --profile preview` (or `npm run build:android:preview`).
4. Download the generated APK from the EAS build result and install it on a test Android device.
5. Test login/OTP delivery, patient booking, booking for another person, doctor/facility schedules, booking cancellation permissions, messaging, notifications, and owner review flows against a configured backend.

Before public Play Store release, confirm the package ID, signing credentials, privacy policy, production API URL, notification credentials, and app store assets. The preview profile is for internal testing, not a store release.

## Verification limits
The V54 script checks configuration contracts only. It does not replace Expo config resolution, TypeScript typechecking, Metro bundling, EAS cloud build, APK signing verification, backend integration tests, or on-device QA.
