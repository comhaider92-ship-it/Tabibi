import { MigrationInterface, QueryRunner } from 'typeorm';

/** Allow a released slot to be booked again after a previous request was rejected or cancelled. */
export class UpdateFacilityBookingSlotUniqueness1732400000000 implements MigrationInterface {
  name = 'UpdateFacilityBookingSlotUniqueness1732400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS uq_facility_booking_slot');
    await queryRunner.query(`CREATE UNIQUE INDEX uq_facility_booking_slot
      ON facility_bookings("slotId")
      WHERE "slotId" IS NOT NULL AND status IN ('requested', 'confirmed')`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS uq_facility_booking_slot');
    await queryRunner.query(`CREATE UNIQUE INDEX uq_facility_booking_slot
      ON facility_bookings("slotId") WHERE "slotId" IS NOT NULL`);
  }
}
