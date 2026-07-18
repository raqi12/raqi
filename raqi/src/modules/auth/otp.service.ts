import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { normalizePhone } from './phone.util';
import {
  Otp,
  OtpDocument,
  OtpPurpose,
  RegisterOtpPayload,
} from './schemas/otp.schema';
import { SmsService } from './sms.service';

const OTP_EXPIRES_SECONDS = 300;
const MAX_OTP_ATTEMPTS = 5;
const DEV_OTP_CODE = '123456';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  private useDevOtp(): boolean {
    const flag = this.configService.get<string>('OTP_DEV_MODE');
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    // Default: dev OTP only when SMS is not enabled
    return !this.smsService.isEnabled();
  }

  async createOtp(
    phone: string,
    purpose: OtpPurpose,
    payload: RegisterOtpPayload | null = null,
  ) {
    const normalizedPhone = normalizePhone(phone);
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_SECONDS * 1000);

    await this.otpModel.deleteMany({ phone: normalizedPhone, purpose }).exec();
    await this.otpModel.create({
      phone: normalizedPhone,
      purpose,
      payload,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt,
      attempts: 0,
    });

    if (this.smsService.isEnabled()) {
      try {
        await this.smsService.sendOtp(normalizedPhone, purpose, code);
      } catch (error) {
        await this.otpModel
          .deleteMany({ phone: normalizedPhone, purpose })
          .exec();
        this.logger.error('Failed to send OTP SMS', error);
        throw new ServiceUnavailableException(
          'تعذر إرسال رمز التحقق عبر الرسائل القصيرة',
        );
      }
    } else if (!this.useDevOtp()) {
      await this.otpModel
        .deleteMany({ phone: normalizedPhone, purpose })
        .exec();
      throw new ServiceUnavailableException(
        'خدمة الرسائل القصيرة غير مُعدّة. أضف ISEND_API_TOKEN.',
      );
    }

    return {
      code,
      expiresIn: OTP_EXPIRES_SECONDS,
      response: this.buildOtpResponse(code, OTP_EXPIRES_SECONDS, purpose),
    };
  }

  async verifyOtp(phone: string, purpose: OtpPurpose, code: string) {
    const normalizedPhone = normalizePhone(phone);
    const record = await this.otpModel
      .findOne({ phone: normalizedPhone, purpose })
      .exec();
    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await record.deleteOne();
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await record.deleteOne();
      throw new BadRequestException('OTP attempts exceeded');
    }

    const valid = await bcrypt.compare(code, record.codeHash);
    if (!valid) {
      record.attempts += 1;
      await record.save();
      throw new BadRequestException('Invalid or expired OTP');
    }

    const payload = record.payload;
    await record.deleteOne();
    return payload as RegisterOtpPayload | null;
  }

  private generateCode(): string {
    if (this.useDevOtp()) {
      return DEV_OTP_CODE;
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private buildOtpResponse(
    code: string,
    expiresIn: number,
    purpose?: OtpPurpose,
  ) {
    const response: {
      otpSent: boolean;
      expiresIn: number;
      otp?: string;
      debugOtp?: string;
    } = {
      otpSent: true,
      expiresIn,
    };

    if (this.useDevOtp()) {
      response.otp = code;
      response.debugOtp = code;
      this.logger.log(
        `[OTP dev] purpose=${purpose ?? 'unknown'} code=${code} expiresIn=${expiresIn}s`,
      );
    }

    return response;
  }
}
