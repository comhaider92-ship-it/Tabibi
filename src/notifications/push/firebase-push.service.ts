import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebasePushService implements OnModuleInit {
  private readonly logger = new Logger(FirebasePushService.name);
  private enabled = false;
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) { this.logger.warn('FCM is not configured; push delivery is disabled until credentials are supplied.'); return; }
    try {
      const serviceAccount = JSON.parse(raw);
      if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
      this.enabled = true;
    } catch (error) {
      this.logger.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON; push delivery remains disabled.');
    }
  }

  isEnabled() { return this.enabled; }

  async send(tokens: string[], title: string, body: string, data: Record<string, string>) {
    if (!this.enabled || tokens.length === 0) return { successCount: 0, failureCount: 0, disabled: !this.enabled };
    const responses: Array<{ success: boolean; error?: { code?: string } }> = [];
    for (let offset = 0; offset < tokens.length; offset += 500) {
      const response = await getMessaging().sendEachForMulticast({
        tokens: tokens.slice(offset, offset + 500), notification: { title, body }, data,
        android: { priority: 'high', notification: { channelId: 'tabibi_appointments' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      responses.push(...response.responses);
    }
    const successCount = responses.filter(r => r.success).length;
    return { successCount, failureCount: responses.length - successCount, responses };
  }
}
