import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreatePatientBeneficiaries1733700000000 implements MigrationInterface {
 name='CreatePatientBeneficiaries1733700000000';
 async up(queryRunner:QueryRunner):Promise<void>{
  await queryRunner.query(`CREATE TABLE "patient_beneficiaries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "ownerUserId" uuid NOT NULL, "displayName" character varying(120) NOT NULL, "phone" character varying(32), "relationship" character varying(40), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_patient_beneficiaries_id" PRIMARY KEY ("id"), CONSTRAINT "FK_patient_beneficiaries_owner" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE)`);
  await queryRunner.query(`CREATE INDEX "idx_patient_beneficiaries_owner" ON "patient_beneficiaries" ("ownerUserId")`);
 }
 async down(queryRunner:QueryRunner):Promise<void>{await queryRunner.query(`DROP INDEX IF EXISTS "idx_patient_beneficiaries_owner"`);await queryRunner.query(`DROP TABLE IF EXISTS "patient_beneficiaries"`);}
}
