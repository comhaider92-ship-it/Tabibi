import { MigrationInterface, QueryRunner } from 'typeorm';
export class SubscriptionRenewalWithoutReapproval1733300000000 implements MigrationInterface {
 name='SubscriptionRenewalWithoutReapproval1733300000000';
 async up(q:QueryRunner):Promise<void>{
  await q.query(`ALTER TABLE "doctor_subscriptions" ADD COLUMN "requiresOwnerApproval" boolean NOT NULL DEFAULT true`);
  await q.query(`UPDATE "doctor_subscriptions" SET "requiresOwnerApproval" = false WHERE status IN ('active','expired')`);
  await q.query(`UPDATE "doctor_subscriptions" AS pending SET "requiresOwnerApproval" = false WHERE pending.status = 'pending' AND EXISTS (SELECT 1 FROM "doctor_subscriptions" AS prior WHERE prior."doctorId" = pending."doctorId" AND prior.id <> pending.id AND prior.status IN ('active','expired'))`);
  await q.query(`CREATE INDEX "ix_doctor_subscriptions_pending_approval" ON "doctor_subscriptions"(status,"requiresOwnerApproval")`);
 }
 async down(q:QueryRunner):Promise<void>{await q.query(`DROP INDEX IF EXISTS "ix_doctor_subscriptions_pending_approval"`);await q.query(`ALTER TABLE "doctor_subscriptions" DROP COLUMN IF EXISTS "requiresOwnerApproval"`);}
}
