import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorDirectoryIndexes1732100000000 implements MigrationInterface {
  name = 'AddDoctorDirectoryIndexes1732100000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE INDEX "ix_doctor_profiles_approved_city_name" ON "doctor_profiles" ("status", LOWER("city"), "fullName")');
    await queryRunner.query('CREATE INDEX "ix_doctor_profiles_approved_subspecialty" ON "doctor_profiles" ("status", "subSpecialty")');
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "ix_doctor_profiles_approved_subspecialty"');
    await queryRunner.query('DROP INDEX "ix_doctor_profiles_approved_city_name"');
  }
}
