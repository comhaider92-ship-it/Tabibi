import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddMedicalCategoriesAndFacilities1732200000000 implements MigrationInterface {
 name='AddMedicalCategoriesAndFacilities1732200000000';
 public async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE medical_facilities (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "ownerUserId" uuid NOT NULL REFERENCES users(id),
   name varchar(180) NOT NULL, "facilityType" varchar(32) NOT NULL CHECK ("facilityType" IN ('laboratory','radiology','diagnostics','imaging')),
   city varchar(80) NOT NULL, address varchar(220) NOT NULL, phone varchar(32), description text,
   status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
   "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
  )`);
  await q.query(`CREATE INDEX ix_medical_facilities_status_city ON medical_facilities(status,city)`);
  await q.query(`CREATE TABLE facility_services (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "facilityId" uuid NOT NULL REFERENCES medical_facilities(id) ON DELETE CASCADE,
   "serviceCode" varchar(40) NOT NULL, name varchar(160) NOT NULL, "priceIqd" integer CHECK("priceIqd" IS NULL OR "priceIqd">=0),
   "expectedDurationMinutes" smallint NOT NULL DEFAULT 30 CHECK("expectedDurationMinutes" BETWEEN 5 AND 480),
   "isActive" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now()
  )`);
  await q.query(`CREATE INDEX ix_facility_services_facility_active ON facility_services("facilityId","isActive")`);
  await q.query(`CREATE TABLE facility_bookings (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "facilityId" uuid NOT NULL REFERENCES medical_facilities(id),
   "serviceId" uuid NOT NULL REFERENCES facility_services(id), "bookedByUserId" uuid NOT NULL REFERENCES users(id),
   "patientName" varchar(120) NOT NULL, "patientPhone" varchar(32), "startsAt" timestamptz NOT NULL,
   status varchar(20) NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','cancelled','completed')),
   "idempotencyKey" varchar(100) NOT NULL UNIQUE, "patientNote" text,
   "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
  )`);
  await q.query(`CREATE INDEX ix_facility_bookings_facility_time ON facility_bookings("facilityId","startsAt")`);
  await q.query(`CREATE UNIQUE INDEX uq_facility_service_active_time ON facility_bookings("facilityId","serviceId","startsAt") WHERE status IN ('requested','confirmed')`);
 }
 public async down(q:QueryRunner):Promise<void>{
  await q.query('DROP TABLE IF EXISTS facility_bookings'); await q.query('DROP TABLE IF EXISTS facility_services'); await q.query('DROP TABLE IF EXISTS medical_facilities');
 }
}
