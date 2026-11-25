import { MigrationInterface, QueryRunner } from 'typeorm';
export class ManualDailyQueue1733500000000 implements MigrationInterface {
 name = 'ManualDailyQueue1733500000000';
 async up(q: QueryRunner): Promise<void> {
  await q.query(`ALTER TABLE "appointments" ADD COLUMN "queueStatus" varchar(20) NOT NULL DEFAULT 'waiting'`);
  await q.query(`ALTER TABLE "appointments" ADD COLUMN "queueUpdatedAt" timestamptz`);
  await q.query(`ALTER TABLE "facility_bookings" ADD COLUMN "queueStatus" varchar(20) NOT NULL DEFAULT 'waiting'`);
  await q.query(`ALTER TABLE "facility_bookings" ADD COLUMN "queueUpdatedAt" timestamptz`);
  await q.query(`CREATE INDEX "ix_appointments_daily_queue" ON "appointments" ("doctorId", "startsAt", "status", "queueStatus")`);
  await q.query(`CREATE INDEX "ix_facility_daily_queue" ON "facility_bookings" ("facilityId", "startsAt", "status", "queueStatus")`);
 }
 async down(q: QueryRunner): Promise<void> {
  await q.query(`DROP INDEX IF EXISTS "ix_facility_daily_queue"`); await q.query(`DROP INDEX IF EXISTS "ix_appointments_daily_queue"`);
  await q.query(`ALTER TABLE "facility_bookings" DROP COLUMN IF EXISTS "queueUpdatedAt", DROP COLUMN IF EXISTS "queueStatus"`);
  await q.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "queueUpdatedAt", DROP COLUMN IF EXISTS "queueStatus"`);
 }
}
