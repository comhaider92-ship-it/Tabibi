import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateDoctorProfiles1731300000000 implements MigrationInterface {
  name = 'CreateDoctorProfiles1731300000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE doctor_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      "fullName" varchar(160) NOT NULL,
      specialty varchar(120) NOT NULL,
      "subSpecialty" varchar(180) NULL,
      qualifications text NULL,
      "experienceYears" smallint NOT NULL DEFAULT 0 CHECK("experienceYears" BETWEEN 0 AND 70),
      bio text NULL,
      "clinicName" varchar(180) NOT NULL,
      address varchar(220) NOT NULL,
      city varchar(80) NOT NULL,
      "contactPhone" varchar(32) NULL,
      "photoUrl" text NULL,
      status varchar(16) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','rejected')),
      "reviewNote" text NULL,
      "reviewedBy" uuid NULL REFERENCES users(id),
      "reviewedAt" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query('CREATE INDEX ix_doctor_profiles_status_specialty ON doctor_profiles(status,specialty)');
    await q.query('CREATE INDEX ix_doctor_profiles_city ON doctor_profiles(city)');
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE doctor_profiles');
  }
}
