import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationDeviceToken } from './device-token.entity';
import { NotificationPreference } from './notification-preference.entity';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { FirebasePushService } from './push/firebase-push.service';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(NotificationDeviceToken) private readonly devices: Repository<NotificationDeviceToken>,
    @InjectRepository(NotificationPreference) private readonly preferences: Repository<NotificationPreference>,
    private readonly push: FirebasePushService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Send an administrative event to every active owner account. */
  async notifyOwners(input: { type: NotificationType; title: string; body: string; data?: Record<string, unknown> }) {
    try {
      const owners = await this.users.find({ where: { role: UserRole.OWNER, isActive: true }, select: { id: true } });
      return await Promise.all(owners.map(owner => this.createAndDispatch({ userId: owner.id, ...input })));
    } catch (error) {
      this.logger.error('Could not dispatch owner notification; the primary operation remains successful.', error instanceof Error ? error.stack : String(error));
      return [];
    }
  }

  /** Persist an in-app notification first, then attempt push delivery without failing the business operation. */
  async createAndDispatch(input: { userId: string; type: NotificationType; title: string; body: string; data?: Record<string, unknown> }) {
    try {
      const notification = await this.repo.save(this.repo.create({
        userId: input.userId, type: input.type, title: input.title, body: input.body, data: input.data ?? {},
        appointmentId: typeof input.data?.appointmentId === 'string' ? input.data.appointmentId : null, isRead: false, readAt: null,
      }));

      try {
        const [preference, devices] = await Promise.all([
          this.preferences.findOne({ where: { userId: input.userId } }),
          this.devices.find({ where: { userId: input.userId, isActive: true } }),
        ]);
        if (preference?.pushEnabled !== false && devices.length > 0 && this.push.isEnabled()) {
          const payload: Record<string, string> = {};
          for (const [key, value] of Object.entries(input.data ?? {})) {
            if (value !== null && value !== undefined) payload[key] = String(value);
          }
          payload.notificationId = notification.id;
          const result = await this.push.send(devices.map(device => device.token), input.title, input.body, payload);
          const invalidTokens = (result.responses ?? []).flatMap((response, index) =>
            !response.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(response.error?.code ?? '')
              ? [devices[index].id] : []);
          if (invalidTokens.length) await this.devices.update({ id: In(invalidTokens) }, { isActive: false });
        }
      } catch (error) {
        this.logger.error('Push notification delivery failed; in-app notification was saved.', error instanceof Error ? error.stack : String(error));
      }
      return notification;
    } catch (error) {
      // A notification subsystem outage must never turn a committed booking into an apparent booking failure.
      this.logger.error('Could not persist an in-app notification.', error instanceof Error ? error.stack : String(error));
      return null;
    }
  }

  async list(userId: string, filters: ListNotificationsDto) {
    const qb = this.repo.createQueryBuilder('n').where('n."userId" = :userId', { userId });
    if (filters.unreadOnly) qb.andWhere('n."isRead" = false');
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 50);
    qb.orderBy('n."createdAt"', 'DESC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    const unreadCount = await this.repo.count({ where: { userId, isRead: false } });
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, unreadCount };
  }

  unreadCount(userId: string) {
    return this.repo.count({ where: { userId, isRead: false } }).then(count => ({ unreadCount: count }));
  }

  async markRead(id: string, userId: string) {
    const notification = await this.repo.findOne({ where: { id, userId } });
    if (!notification) throw new NotFoundException('الإشعار غير موجود');
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.repo.save(notification);
    }
    return { id: notification.id, isRead: notification.isRead, readAt: notification.readAt };
  }

  async markAllRead(userId: string) {
    const result = await this.repo.createQueryBuilder().update(Notification)
      .set({ isRead: true, readAt: () => 'now()' })
      .where('"userId" = :userId AND "isRead" = false', { userId }).execute();
    return { updated: result.affected ?? 0 };
  }

  async registerDevice(userId: string, dto: RegisterDeviceTokenDto) {
    // A token can belong to only one account at a time (shared devices may switch accounts).
    await this.devices.upsert({ userId, token: dto.token, platform: dto.platform, isActive: true }, ['token']);
    const device = await this.devices.findOne({ where: { token: dto.token, userId } });
    return { registered: true, deviceId: device?.id };
  }

  async removeDevice(userId: string, id: string) {
    const device = await this.devices.findOne({ where: { id, userId } });
    if (!device) throw new NotFoundException('الجهاز غير مسجل لهذا الحساب');
    device.isActive = false;
    await this.devices.save(device);
    return { removed: true };
  }

  async getPreferences(userId: string) {
    const pref = await this.preferences.findOne({ where: { userId } });
    return pref ?? { userId, pushEnabled: true, remindersEnabled: true };
  }

  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const current = await this.preferences.findOne({ where: { userId } });
    const pref = this.preferences.create({
      userId, pushEnabled: dto.pushEnabled ?? current?.pushEnabled ?? true,
      remindersEnabled: dto.remindersEnabled ?? current?.remindersEnabled ?? true,
    });
    return this.preferences.save(pref);
  }
}
