import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateScheduleExceptions1732600000000 implements MigrationInterface {
  name = 'CreateScheduleExceptions1732600000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE schedule_exceptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "ownerType" varchar(16) NOT NULL CHECK ("ownerType" IN ('doctor','facility')),
      "ownerId" uuid NOT NULL,
      "serviceId" uuid NULL REFERENCES facility_services(id) ON DELETE CASCADE,
      "startsAt" timestamptz NOT NULL,
      "endsAt" timestamptz NOT NULL,
      timezone varchar(64) NOT NULL DEFAULT 'Asia/Baghdad',
      reason varchar(240) NULL,
      "affectedSlotIds" uuid[] NOT NULL DEFAULT '{}'::uuid[],
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CHECK ("endsAt" > "startsAt"),
      CHECK (("ownerType"='doctor' AND "serviceId" IS NULL) OR "ownerType"='facility')
    )`);
    await q.query(`CREATE INDEX ix_schedule_exception_owner_range ON schedule_exceptions("ownerType","ownerId","isActive","startsAt","endsAt")`);
    await q.query(`CREATE INDEX ix_schedule_exception_service ON schedule_exceptions("serviceId") WHERE "serviceId" IS NOT NULL`);
  }
  async down(q: QueryRunner): Promise<void> { await q.query('DROP TABLE IF EXISTS schedule_exceptions'); }
}
