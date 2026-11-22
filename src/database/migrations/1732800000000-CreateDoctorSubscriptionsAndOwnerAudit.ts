import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateDoctorSubscriptionsAndOwnerAudit1732800000000 implements MigrationInterface {
 name='CreateDoctorSubscriptionsAndOwnerAudit1732800000000';
 async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE doctor_subscriptions (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "doctorId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   "durationDays" integer NOT NULL CHECK ("durationDays" BETWEEN 1 AND 365),
   "amountIqd" integer NOT NULL CHECK ("amountIqd" > 0), status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','expired')),
   "transferReference" varchar(120) NULL, "proofUrl" text NULL, "doctorNote" text NULL, "reviewNote" text NULL,
   "startsAt" timestamptz NULL, "expiresAt" timestamptz NULL, "reviewedBy" uuid NULL REFERENCES users(id) ON DELETE SET NULL,
   "reviewedAt" timestamptz NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
  )`);
  await q.query('CREATE INDEX ix_doctor_subscriptions_doctor_status_expiry ON doctor_subscriptions ("doctorId", status, "expiresAt")');
  await q.query(`CREATE TABLE owner_audit_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
   action varchar(80) NOT NULL, "targetType" varchar(80) NOT NULL, "targetId" uuid NULL, details jsonb NOT NULL DEFAULT '{}'::jsonb,
   "createdAt" timestamptz NOT NULL DEFAULT now()
  )`);
  await q.query('CREATE INDEX ix_owner_audit_logs_created ON owner_audit_logs ("createdAt" DESC)');
 }
 async down(q:QueryRunner):Promise<void>{await q.query('DROP TABLE IF EXISTS owner_audit_logs');await q.query('DROP TABLE IF EXISTS doctor_subscriptions');}
}
