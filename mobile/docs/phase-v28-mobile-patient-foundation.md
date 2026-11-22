# V28 — Mobile patient app foundation

This phase introduces an Expo / React Native patient-app scaffold alongside the existing NestJS backend.

## Screens included
- Patient login using the existing `/auth/login` endpoint.
- Home screen with categories from `/medical-directory/categories`.
- Search by doctor name/specialty or facility/service name.
- Provider detail screen.
- Facility service and available-slot selection, followed by a booking request.
- Patient bookings list combining doctor appointments and facility bookings.
- Booking for another person by entering the beneficiary/patient name and optional phone (completed for both doctor and facility workflows in V29).

## Configuration
Set `EXPO_PUBLIC_API_URL` to the deployed API base, including `/api/v1`. For Android emulator use `http://10.0.2.2:3000/api/v1`; for a physical device use the reachable LAN IP or HTTPS domain. Do not use localhost on a physical phone.

Install and run:
```bash
cd mobile
npm install
npm run typecheck
npm run android
```

## Important boundaries / follow-up
- This is the first mobile foundation, not a production-ready store build.
- Doctor booking loads public open slots. V29 adds guest-beneficiary support, so the signed-in patient can book for another person using their name and optional phone without requiring a second account.
- Facility booking uses the existing slot and booking endpoints. The API currently accepts patientName and optional patientPhone; booking another person is supported.
- The login response/token contract must be confirmed against the deployed backend before production. The token is held in memory only; secure persistent storage and refresh/session expiry handling are not yet implemented.
- Registration UI, OTP verification UI, push permission/token registration, Arabic RTL device testing, and role-specific doctor/owner dashboards are follow-up work.
- V28 itself introduced no migration. V29 adds `1732700000000-AllowGuestBeneficiaryDoctorBookings`; run it before using guest-beneficiary doctor bookings.
