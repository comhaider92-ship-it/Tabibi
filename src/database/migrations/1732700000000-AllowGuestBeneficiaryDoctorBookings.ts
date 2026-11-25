import { MigrationInterface, QueryRunner } from 'typeorm';

/** Allows a signed-in patient to book a doctor for a relative without requiring that relative to create an account. */
export class AllowGuestBeneficiaryDoctorBookings1732700000000 implements MigrationInterface {
  name = 'AllowGuestBeneficiaryDoctorBookings1732700000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE appointments ALTER COLUMN "beneficiaryId" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE appointments ADD COLUMN "beneficiaryName" varchar(120) NULL');
    await queryRunner.query('ALTER TABLE appointments ADD COLUMN "beneficiaryPhone" varchar(32) NULL');
    await queryRunner.query(`ALTER TABLE appointments ADD CONSTRAINT ck_appointments_beneficiary
      CHECK ("beneficiaryId" IS NOT NULL OR NULLIF(BTRIM("beneficiaryName"), '') IS NOT NULL)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE appointments DROP CONSTRAINT ck_appointments_beneficiary');
    await queryRunner.query('DELETE FROM appointments WHERE "beneficiaryId" IS NULL');
    await queryRunner.query('ALTER TABLE appointments DROP COLUMN "beneficiaryPhone"');
    await queryRunner.query('ALTER TABLE appointments DROP COLUMN "beneficiaryName"');
    await queryRunner.query('ALTER TABLE appointments ALTER COLUMN "beneficiaryId" SET NOT NULL');
  }
}
