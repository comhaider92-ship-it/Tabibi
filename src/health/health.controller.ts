import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Minimal operational probes. These endpoints intentionally expose no secrets or DB details. */
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      const migrationsPending = await this.dataSource.showMigrations();
      if (migrationsPending) {
        throw new Error('Database migrations are pending');
      }
      return { status: 'ready', database: 'reachable', migrations: 'current' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }
}
