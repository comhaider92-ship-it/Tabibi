import { MigrationInterface,QueryRunner } from 'typeorm';
export class CreateUsersAndAppointments1731200000000 implements MigrationInterface {
 name='CreateUsersAndAppointments1731200000000';
 async up(q:QueryRunner):Promise<void>{
  await q.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await q.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
  await q.query(`CREATE TABLE users (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(254) NULL, phone varchar(32) NULL,
   "displayName" varchar(120) NOT NULL, "passwordHash" varchar(255) NOT NULL,
   role varchar(16) NOT NULL CHECK(role IN ('patient','doctor','owner')),
   "isVerified" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true,
   "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
   CHECK(email IS NOT NULL OR phone IS NOT NULL)
  )`);
  await q.query('CREATE UNIQUE INDEX uq_users_email ON users(LOWER(email)) WHERE email IS NOT NULL');
  await q.query('CREATE UNIQUE INDEX uq_users_phone ON users(phone) WHERE phone IS NOT NULL');
  await q.query(`CREATE TABLE auth_otps (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   target varchar(254) NOT NULL, purpose varchar(24) NOT NULL CHECK(purpose IN ('verify_account','reset_password')),
   "codeHash" varchar(255) NOT NULL, "expiresAt" timestamptz NOT NULL, "consumedAt" timestamptz NULL,
   attempts int NOT NULL DEFAULT 0, "createdAt" timestamptz NOT NULL DEFAULT now()
  )`);
  await q.query('CREATE INDEX ix_auth_otps_user_purpose_created ON auth_otps("userId",purpose,"createdAt")');
  await q.query(`CREATE TABLE appointments (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "doctorId" uuid NOT NULL REFERENCES users(id),
   "bookedByUserId" uuid NOT NULL REFERENCES users(id), "beneficiaryId" uuid NOT NULL REFERENCES users(id),
   "startsAt" timestamptz NOT NULL, "endsAt" timestamptz NOT NULL,
   status varchar(24) NOT NULL DEFAULT 'confirmed', "idempotencyKey" varchar(100) NOT NULL UNIQUE,
   "patientNote" text NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
   CHECK("endsAt" > "startsAt")
  )`);
  await q.query(`ALTER TABLE appointments ADD CONSTRAINT ex_doctor_appointment_no_overlap
   EXCLUDE USING gist ("doctorId" WITH =, tstzrange("startsAt","endsAt",'[)') WITH &&)
   WHERE (status='confirmed')`);
 }
 async down(q:QueryRunner):Promise<void>{await q.query('DROP TABLE appointments');await q.query('DROP TABLE auth_otps');await q.query('DROP TABLE users');}
}
