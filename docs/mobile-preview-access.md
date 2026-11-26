# Tabibi mobile preview

## Preview source
The interactive, self-contained UI demonstration lives in `mobile/src/PreviewApp.tsx`. It contains simulated patient, doctor and owner views and local demo actions. It is NOT connected to the API and does not represent production security or live data.

Source link: https://github.com/comhaider92-ship-it/Tabibi/blob/tabibi-home-improvements-2026-11/mobile/src/PreviewApp.tsx

## Opening a rendered preview
A hosted Expo preview (web or installable preview build) has not yet been deployed. This repository source link is not a rendered preview.

For a rendered demo, the Expo project must be built/run in an environment with dependencies installed and Expo web support configured, or an EAS preview APK must be built and shared. Do not use simulated owner controls for real data.

## Current app entry
`mobile/App.tsx` runs the live API-connected app. `PreviewApp.tsx` is a standalone demo component and is not currently the app entry point.
