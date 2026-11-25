import { MigrationInterface, QueryRunner } from 'typeorm';

/** V69: saved family/beneficiary management was removed. Booking for another person remains an ad-hoc booking detail. */
export class RemovePatientSavedBeneficiaries1733800000000 implements MigrationInterface {
 name = 'RemovePatientSavedBeneficiaries1733800000000';
 async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE IF EXISTS "patient_beneficiaries"`);
 }
 async down(queryRunner: QueryRunner): Promise<void> {
  // Intentionally do not recreate personal saved-contact data after rollback.
 }
}
