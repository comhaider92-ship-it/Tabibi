import { MigrationInterface, QueryRunner } from 'typeorm';
export class ExpandUserRoleColumnForFacilityManagers1734700000000 implements MigrationInterface {
 name='ExpandUserRoleColumnForFacilityManagers1734700000000';
 public async up(queryRunner:QueryRunner):Promise<void>{
  await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE varchar(20)`);
 }
 public async down(queryRunner:QueryRunner):Promise<void>{
  await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE varchar(16)`);
 }
}
