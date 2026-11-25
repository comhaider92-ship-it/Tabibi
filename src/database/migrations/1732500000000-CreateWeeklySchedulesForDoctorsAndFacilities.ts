import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateWeeklySchedulesForDoctorsAndFacilities1732500000000 implements MigrationInterface {
 name='CreateWeeklySchedulesForDoctorsAndFacilities1732500000000';
 public async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE weekly_schedule_rules (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   "ownerType" varchar(16) NOT NULL CHECK("ownerType" IN ('doctor','facility')),
   "ownerId" uuid NOT NULL,
   "serviceId" uuid NULL REFERENCES facility_services(id) ON DELETE CASCADE,
   weekday smallint NOT NULL CHECK(weekday BETWEEN 0 AND 6),
   "startTime" varchar(5) NOT NULL CHECK("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
   "endTime" varchar(5) NOT NULL CHECK("endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
   breaks jsonb NOT NULL DEFAULT '[]'::jsonb,
   timezone varchar(64) NOT NULL DEFAULT 'Asia/Baghdad',
   "isActive" boolean NOT NULL DEFAULT true,
   "createdAt" timestamptz NOT NULL DEFAULT now(),
   "updatedAt" timestamptz NOT NULL DEFAULT now(),
   CHECK("startTime" < "endTime"),
   CHECK(("ownerType"='doctor' AND "serviceId" IS NULL) OR ("ownerType"='facility' AND "serviceId" IS NOT NULL))
  )`);
  await q.query(`CREATE INDEX ix_weekly_schedule_owner_day ON weekly_schedule_rules("ownerType","ownerId",weekday,"isActive")`);
  await q.query(`CREATE INDEX ix_weekly_schedule_service ON weekly_schedule_rules("serviceId",weekday) WHERE "serviceId" IS NOT NULL`);
 }
 public async down(q:QueryRunner):Promise<void>{ await q.query(`DROP TABLE IF EXISTS weekly_schedule_rules`); }
}
