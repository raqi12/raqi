import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
  Otp,
  OtpDocument,
  OtpPurpose,
  RegisterOtpPayload,
} from './schemas/otp.schema';

const OTP_EXPIRES_SECONDS = 300;
const MAX_OTP_ATTEMPTS = 5;

/** Fixed OTP for testing — replace with SMS provider before production. */
const DEV_OTP_CODE = '123456';
const USE_DEV_OTP = true;

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
  ) {}

  async createOtp(
    phone: string,
    purpose: OtpPurpose,
    payload: RegisterOtpPayload | null = null,
  ) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_SECONDS * 1000);

    await this.otpModel.deleteMany({ phone, purpose }).exec();
    await this.otpModel.create({
      phone,
      purpose,
      payload,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt,
      attempts: 0,
    });

    return {
      code,
      expiresIn: OTP_EXPIRES_SECONDS,
      response: this.buildOtpResponse(code, OTP_EXPIRES_SECONDS),
    };
  }

  async verifyOtp(phone: string, purpose: OtpPurpose, code: string) {
    const record = await this.otpModel.findOne({ phone, purpose }).exec();
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
    if (USE_DEV_OTP) {
      return DEV_OTP_CODE;
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private buildOtpResponse(code: string, expiresIn: number) {
    const response: {
      otpSent: boolean;
      expiresIn: number;
      otp?: string;
      debugOtp?: string;
    } = {
      otpSent: true,
      expiresIn,
    };

    if (USE_DEV_OTP) {
      response.otp = code;
      response.debugOtp = code;
      console.log(`[OTP dev] code=${code} expiresIn=${expiresIn}s`);
    }

    return response;
  }
}
