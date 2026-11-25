import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrescriptionVerificationTokens1734500000000 implements MigrationInterface {
  name = 'AddPrescriptionVerificationTokens1734500000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "medical_prescriptions" ADD COLUMN "verificationToken" varchar(64) NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_medical_prescriptions_verification_token" ON "medical_prescriptions" ("verificationToken") WHERE "verificationToken" IS NOT NULL`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "uq_medical_prescriptions_verification_token"`);
    await queryRunner.query(`ALTER TABLE "medical_prescriptions" DROP COLUMN "verificationToken"`);
  }
}
