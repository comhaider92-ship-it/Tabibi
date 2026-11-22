import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddAdTargetsAndHospitalType1733000000000 implements MigrationInterface {
 name='AddAdTargetsAndHospitalType1733000000000';
 public async up(q:QueryRunner):Promise<void>{
  await q.query(`ALTER TABLE medical_facilities DROP CONSTRAINT IF EXISTS "medical_facilities_facilityType_check"`);
  await q.query(`ALTER TABLE medical_facilities ADD CONSTRAINT "medical_facilities_facilityType_check" CHECK ("facilityType" IN ('laboratory','radiology','diagnostics','imaging','hospital'))`);
  await q.query(`ALTER TABLE "advertisements" ADD COLUMN "targetType" varchar(16) NOT NULL DEFAULT 'none'`);
  await q.query(`ALTER TABLE "advertisements" ADD COLUMN "targetId" uuid`);
  await q.query(`CREATE INDEX "ix_advertisements_target" ON "advertisements" ("targetType","targetId")`);
 }
 public async down(q:QueryRunner):Promise<void>{
  await q.query(`DROP INDEX IF EXISTS "ix_advertisements_target"`);
  await q.query(`ALTER TABLE "advertisements" DROP COLUMN IF EXISTS "targetId"`);
  await q.query(`ALTER TABLE "advertisements" DROP COLUMN IF EXISTS "targetType"`);
  await q.query(`ALTER TABLE medical_facilities DROP CONSTRAINT IF EXISTS "medical_facilities_facilityType_check"`);
  await q.query(`ALTER TABLE medical_facilities ADD CONSTRAINT "medical_facilities_facilityType_check" CHECK ("facilityType" IN ('laboratory','radiology','diagnostics','imaging'))`);
 }
}
