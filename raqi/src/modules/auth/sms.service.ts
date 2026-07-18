import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatPhoneForSms } from './phone.util';

export type SmsOtpPurpose = 'register' | 'reset_password' | 'delete_account';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('ISEND_API_TOKEN')?.trim());
  }

  isEnabled(): boolean {
    const flag = this.configService.get<string>('SMS_OTP_ENABLED');
    if (flag === 'false') return false;
    if (flag === 'true') return this.isConfigured();
    return this.isConfigured();
  }

  buildOtpMessage(purpose: SmsOtpPurpose, code: string): string {
    switch (purpose) {
      case 'register':
        return `رمز التحقق لتسجيل حساب راقي: ${code}`;
      case 'reset_password':
        return `رمز إعادة تعيين كلمة المرور في راقي: ${code}`;
      case 'delete_account':
        return `رمز تأكيد حذف حساب راقي: ${code}`;
      default:
        return `رمز التحقق من راقي: ${code}`;
    }
  }

  async sendOtp(
    phone: string,
    purpose: SmsOtpPurpose,
    code: string,
  ): Promise<void> {
    const message = this.buildOtpMessage(purpose, code);
    await this.sendSms(phone, message);
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const apiToken = this.configService.get<string>('ISEND_API_TOKEN')?.trim();
    if (!apiToken) {
      throw new Error('ISEND_API_TOKEN is not configured');
    }

    // Official iSend v3 (Bearer). Legacy HTTP body-token path kept as fallback.
    const apiUrl =
      this.configService.get<string>('ISEND_API_URL')?.trim() ||
      'https://isend.com.ly/api/v3/sms/send';
    const senderId =
      this.configService.get<string>('ISEND_SENDER_ID')?.trim() || 'Raqi';
    const recipient = formatPhoneForSms(phone);
    const useV3 = apiUrl.includes('/api/v3/');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const body: Record<string, string> = {
      recipient,
      sender_id: senderId,
      type: 'plain',
      message,
    };

    if (useV3) {
      headers.Authorization = `Bearer ${apiToken}`;
    } else {
      body.api_token = apiToken;
    }

    this.logger.log(`Sending SMS to ${recipient} via ${apiUrl}`);

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (error) {
      this.logger.error('SMS network error', error);
      throw new Error(
        error instanceof Error ? error.message : 'SMS network error',
      );
    }

    const raw = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      payload = { raw };
    }

    const apiStatus = typeof payload.status === 'string' ? payload.status : '';
    if (!response.ok || apiStatus === 'error') {
      this.logger.error(`SMS failed (${response.status})`, payload);
      throw new Error(
        typeof payload.message === 'string'
          ? payload.message
          : JSON.stringify(payload),
      );
    }

    this.logger.log(`SMS sent successfully to ${recipient}`);
  }
}
