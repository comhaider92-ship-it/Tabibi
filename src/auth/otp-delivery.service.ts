import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);
  constructor(private readonly config: ConfigService) {}

  async deliver(target: string, code: string, channel: 'sms' | 'email'): Promise<void> {
    const message = `رمز التحقق الخاص بتطبيق طبيبي هو: ${code}. صالح لمدة 5 دقائق. لا تشاركه مع أي شخص.`;
    if (channel === 'email') return this.deliverEmail(target, code, message);
    return this.deliverSms(target, message);
  }

  private async deliverEmail(target: string, code: string, message: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const from = this.config.get<string>('SMTP_FROM');
    if (!host || !user || !pass || !from) {
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.warn(`[DEV OTP email] target=${target} code=${code}`);
        return;
      }
      throw new ServiceUnavailableException('خدمة البريد الإلكتروني غير مهيأة حالياً');
    }
    try {
      const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
      await transport.sendMail({ from, to: target, subject: 'رمز التحقق - طبيبي', text: message, html: `<div dir="rtl"><h2>تطبيق طبيبي</h2><p>${message}</p></div>` });
    } catch (error) {
      this.logger.error('OTP email delivery failed.', error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException('تعذر إرسال رمز التحقق عبر البريد الإلكتروني');
    }
  }

  private async deliverSms(target: string, message: string): Promise<void> {
    const endpoint = this.config.get<string>('SMS_API_URL');
    const token = this.config.get<string>('SMS_API_TOKEN');
    const sender = this.config.get<string>('SMS_SENDER_ID');
    if (!endpoint || !token) {
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.warn(`[DEV OTP sms] target=${target} code=${message.match(/\d{6}/)?.[0] ?? '[hidden]'}`);
        return;
      }
      throw new ServiceUnavailableException('خدمة الرسائل النصية غير مهيأة حالياً');
    }
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: target, message, sender }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`SMS provider returned HTTP ${response.status}`);
    } catch (error) {
      this.logger.error('OTP SMS delivery failed.', error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException('تعذر إرسال رمز التحقق عبر الرسائل النصية');
    }
  }
}
