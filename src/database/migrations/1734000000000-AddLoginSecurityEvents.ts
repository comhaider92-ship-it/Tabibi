import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginSecurityEvents1734000000000 implements MigrationInterface {
  name = 'AddLoginSecurityEvents1734000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "login_security_events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "identifierHash" varchar(64) NOT NULL, "ipHash" varchar(64) NOT NULL, "succeeded" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_login_security_events" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "ix_login_security_identifier_created" ON "login_security_events" ("identifierHash", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "ix_login_security_ip_created" ON "login_security_events" ("ipHash", "createdAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "login_security_events"`);
  }
}
