import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { AppointmentReminder, ReminderStatus } from './appointment-reminder.entity';
import { NotificationDeviceToken } from './device-token.entity';
import { NotificationPreference } from './notification-preference.entity';
import { FirebasePushService } from './push/firebase-push.service';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class ReminderWorkerService {
  private readonly logger = new Logger(ReminderWorkerService.name);
  private running = false;
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AppointmentReminder) private readonly reminders: Repository<AppointmentReminder>,
    @InjectRepository(NotificationDeviceToken) private readonly tokens: Repository<NotificationDeviceToken>,
    @InjectRepository(NotificationPreference) private readonly preferences: Repository<NotificationPreference>,
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    private readonly push: FirebasePushService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDueReminders() {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.dataSource.transaction(async manager => {
        const rows = await manager.getRepository(AppointmentReminder).createQueryBuilder('r')
          .setLock('pessimistic_write').setOnLocked('skip_locked')
          .where(`(r.status = :pending OR (r.status = :processing AND r."updatedAt" < now() - interval '10 minutes')) AND r."sendAt" <= now()`, { pending: ReminderStatus.PENDING, processing: ReminderStatus.PROCESSING })
          .orderBy('r."sendAt"', 'ASC').take(100).getMany();
        for (const row of rows) row.status = ReminderStatus.PROCESSING;
        if (rows.length) await manager.getRepository(AppointmentReminder).save(rows);
        return rows;
      });
      for (const reminder of due) await this.deliver(reminder);
    } catch (error) {
      this.logger.error('Reminder dispatch cycle failed', error instanceof Error ? error.stack : String(error));
    } finally { this.running = false; }
  }

  private async deliver(reminder: AppointmentReminder) {
    const [appointment, preference, devices] = await Promise.all([
      this.dataSource.getRepository(Appointment).findOne({ where: { id: reminder.appointmentId } }),
      this.preferences.findOne({ where: { userId: reminder.recipientUserId } }),
      this.tokens.find({ where: { userId: reminder.recipientUserId, isActive: true } }),
    ]);
    if (!appointment || appointment.status !== AppointmentStatus.CONFIRMED || preference?.remindersEnabled === false) {
      reminder.status = ReminderStatus.SKIPPED;
      await this.reminders.save(reminder);
      return;
    }
    const label = reminder.kind === '24h' ? 'غداً' : 'خلال ساعتين';
    const title = 'تذكير بموعد طبي';
    const body = `لديك موعد طبي ${label}.`;
    const reminderType = reminder.kind === '24h' ? NotificationType.APPOINTMENT_REMINDER_24H : NotificationType.APPOINTMENT_REMINDER_2H;
    const existing = await this.notifications.findOne({ where: { userId: reminder.recipientUserId, appointmentId: appointment.id, type: reminderType } });
    if (!existing) await this.notifications.save(this.notifications.create({
      userId: reminder.recipientUserId, appointmentId: appointment.id, type: reminderType,
      title, body, data: { appointmentId: appointment.id, reminderKind: reminder.kind, startsAt: appointment.startsAt.toISOString() },
      isRead: false, readAt: null,
    }));

    // In-app reminders are always delivered. Push is an additional channel only when configured.
    if (preference?.pushEnabled === false || devices.length === 0 || !this.push.isEnabled()) {
      reminder.status = ReminderStatus.SENT;
      reminder.sentAt = new Date();
      await this.reminders.save(reminder);
      return;
    }
    try {
      const result = await this.push.send(devices.map(d => d.token), title, body, {
        appointmentId: appointment.id, kind: reminder.kind, startsAt: appointment.startsAt.toISOString(),
      });
      if (result.disabled) {
        reminder.status = ReminderStatus.SENT; reminder.sentAt = new Date(); await this.reminders.save(reminder); return;
      }
      const invalidTokens = (result.responses ?? []).flatMap((r, i) => !r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code ?? '') ? [devices[i].id] : []);
      if (invalidTokens.length) await this.tokens.update({ id: In(invalidTokens) } as any, { isActive: false });
      reminder.attempts += 1;
      reminder.status = result.successCount > 0 ? ReminderStatus.SENT : (reminder.attempts >= 5 ? ReminderStatus.FAILED : ReminderStatus.PENDING);
      reminder.sentAt = result.successCount > 0 ? new Date() : null;
      reminder.lastError = result.failureCount ? `${result.failureCount} device push delivery failure(s)` : null;
      if (reminder.status === ReminderStatus.PENDING) reminder.sendAt = new Date(Date.now() + Math.min(reminder.attempts * 5, 30) * 60_000);
    } catch (error) {
      // Retry only the optional push attempt; the existing in-app notification is reused.
      reminder.attempts += 1;
      reminder.lastError = error instanceof Error ? error.message.slice(0, 1000) : 'Unknown push error';
      reminder.status = reminder.attempts >= 5 ? ReminderStatus.FAILED : ReminderStatus.PENDING;
      if (reminder.status === ReminderStatus.PENDING) reminder.sendAt = new Date(Date.now() + Math.min(reminder.attempts * 5, 30) * 60_000);
    }
    await this.reminders.save(reminder);
  }
}
