import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export type PushPayload = {
  title: string;
  body: string;
  image?: string | null;
  data?: Record<string, string>;
};

export type PushSendResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

@Injectable()
export class FirebasePushService implements OnModuleInit {
  private readonly logger = new Logger(FirebasePushService.name);
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials missing; push notifications disabled',
      );
      return;
    }

    try {
      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      this.enabled = true;
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendToTokens(
    tokens: string[],
    payload: PushPayload,
  ): Promise<PushSendResult> {
    if (!this.enabled || tokens.length === 0) {
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      try {
        const response = await getMessaging().sendEachForMulticast({
          tokens: chunk,
          notification: {
            title: payload.title,
            body: payload.body,
            ...(payload.image ? { imageUrl: payload.image } : {}),
          },
          data: payload.data,
        });
        successCount += response.successCount;
        failureCount += response.failureCount;
        response.responses.forEach((result, index) => {
          if (!result.success) {
            const code = result.error?.code ?? '';
            const message = result.error?.message ?? 'unknown';
            this.logger.warn(`FCM token failed: ${code} — ${message}`);
            if (
              code.includes('registration-token-not-registered') ||
              code.includes('invalid-registration-token') ||
              code.includes('invalid-argument')
            ) {
              invalidTokens.push(chunk[index]);
            }
          }
        });
      } catch (error) {
        this.logger.error('FCM multicast failed', error);
        failureCount += chunk.length;
      }
    }

    return { successCount, failureCount, invalidTokens };
  }
}
