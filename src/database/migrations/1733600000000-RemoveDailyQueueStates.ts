import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDailyQueueStates1733600000000 implements MigrationInterface {
  name = 'RemoveDailyQueueStates1733600000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "ix_facility_daily_queue"`);
    await q.query(`DROP INDEX IF EXISTS "ix_appointments_daily_queue"`);
    await q.query(`ALTER TABLE "facility_bookings" DROP COLUMN IF EXISTS "queueUpdatedAt", DROP COLUMN IF EXISTS "queueStatus"`);
    await q.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "queueUpdatedAt", DROP COLUMN IF EXISTS "queueStatus"`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "appointments" ADD COLUMN "queueStatus" varchar(20) NOT NULL DEFAULT 'waiting', ADD COLUMN "queueUpdatedAt" timestamptz`);
    await q.query(`ALTER TABLE "facility_bookings" ADD COLUMN "queueStatus" varchar(20) NOT NULL DEFAULT 'waiting', ADD COLUMN "queueUpdatedAt" timestamptz`);
    await q.query(`CREATE INDEX "ix_appointments_daily_queue" ON "appointments" ("doctorId", "startsAt", "status", "queueStatus")`);
    await q.query(`CREATE INDEX "ix_facility_daily_queue" ON "facility_bookings" ("facilityId", "startsAt", "status", "queueStatus")`);
  }
}
