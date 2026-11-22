import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddFacilityAvailabilityAndManagement1732300000000 implements MigrationInterface {
 name='AddFacilityAvailabilityAndManagement1732300000000';
 public async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE facility_availability_slots (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   "facilityId" uuid NOT NULL REFERENCES medical_facilities(id) ON DELETE CASCADE,
   "serviceId" uuid NOT NULL REFERENCES facility_services(id) ON DELETE CASCADE,
   "startsAt" timestamptz NOT NULL, "endsAt" timestamptz NOT NULL,
   status varchar(16) NOT NULL DEFAULT 'available' CHECK(status IN ('available','booked','cancelled')),
   "createdAt" timestamptz NOT NULL DEFAULT now(), CHECK("endsAt">"startsAt")
  )`);
  await q.query(`CREATE UNIQUE INDEX uq_facility_service_slot_start ON facility_availability_slots("facilityId","serviceId","startsAt")`);
  await q.query(`CREATE INDEX ix_facility_slots_public_lookup ON facility_availability_slots("facilityId","serviceId",status,"startsAt")`);
  await q.query(`ALTER TABLE facility_bookings ADD COLUMN "slotId" uuid NULL REFERENCES facility_availability_slots(id)`);
  await q.query(`ALTER TABLE facility_bookings ADD COLUMN "statusNote" varchar(500)`);
  await q.query(`CREATE UNIQUE INDEX uq_facility_booking_slot ON facility_bookings("slotId") WHERE "slotId" IS NOT NULL`);
  await q.query(`ALTER TABLE facility_bookings DROP CONSTRAINT IF EXISTS facility_bookings_status_check`);
  await q.query(`ALTER TABLE facility_bookings ADD CONSTRAINT facility_bookings_status_check CHECK(status IN ('requested','confirmed','cancelled','completed','rejected'))`);
 }
 public async down(q:QueryRunner):Promise<void>{
  await q.query(`ALTER TABLE facility_bookings DROP CONSTRAINT IF EXISTS facility_bookings_status_check`);
  await q.query(`ALTER TABLE facility_bookings ADD CONSTRAINT facility_bookings_status_check CHECK(status IN ('requested','confirmed','cancelled','completed'))`);
  await q.query(`DROP INDEX IF EXISTS uq_facility_booking_slot`);
  await q.query(`ALTER TABLE facility_bookings DROP COLUMN IF EXISTS "statusNote"`);
  await q.query(`ALTER TABLE facility_bookings DROP COLUMN IF EXISTS "slotId"`);
  await q.query(`DROP TABLE IF EXISTS facility_availability_slots`);
 }
}
