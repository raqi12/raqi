import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CustomerType } from '../../common/customer-type';
import { AuthUser } from '../../common/auth-user.interface';
import { Role } from '../../common/roles.enum';
import { UsersService } from '../users/users.service';
import { CustomersService } from '../customers/customers.service';
import { WalletsService } from '../wallets/wallets.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateMeDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { normalizePhone } from './phone.util';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  private readonly refreshTokens = new Map<string, string>();

  constructor(
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
    private readonly walletsService: WalletsService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(body: RegisterDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const phone = normalizePhone(body.phone);
    const existing = await this.usersService.findByPhone(phone);
    if (existing) {
      throw new BadRequestException('Phone already registered');
    }

    await this.customersService.validateLocation(body.cityId, body.areaId);

    const { response } = await this.otpService.createOtp(phone, 'register', {
      fullName: body.fullName,
      password: body.password,
      activityType: body.activityType,
      cityId: body.cityId,
      areaId: body.areaId,
      addressDetails: body.addressDetails,
    });

    return {
      ...response,
      phone,
      activityType: body.activityType,
    };
  }

  async verifyOtp(body: VerifyOtpDto) {
    const phone = normalizePhone(body.phone);

    if (body.purpose !== 'register') {
      throw new BadRequestException(
        'Use /auth/reset-password to complete password reset',
      );
    }

    const payload = await this.otpService.verifyOtp(
      phone,
      'register',
      body.otp,
    );
    if (!payload) {
      throw new BadRequestException('Invalid registration OTP');
    }

    const existing = await this.usersService.findByPhone(phone);
    if (existing) {
      throw new BadRequestException('Phone already registered');
    }

    const user = await this.usersService.createCustomerUser({
      phone,
      name: payload.fullName,
      password: payload.password,
      phoneVerified: true,
    });
    const customer = await this.customersService.create({
      userId: String(user.id),
      type: payload.activityType as CustomerType,
      cityId: payload.cityId,
      areaId: payload.areaId,
    });
    await this.customersService.createInitialAddress(String(customer.id), {
      cityId: payload.cityId,
      areaId: payload.areaId,
      details: payload.addressDetails,
    });
    await this.walletsService.ensureWallet(String(customer.id));

    return this.issueAuthResponse(
      user,
      customer.toJSON() as unknown as Record<string, unknown>,
    );
  }

  async login(body: LoginDto) {
    if (!body.email && !body.phone) {
      throw new BadRequestException('Email or phone is required');
    }
    if (body.email && body.phone) {
      throw new BadRequestException('Provide either email or phone, not both');
    }

    const user = body.email
      ? await this.usersService.findByEmail(body.email)
      : await this.usersService.findByPhone(body.phone!);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (body.phone && user.role === Role.Customer && !user.phoneVerified) {
      throw new UnauthorizedException('Phone number is not verified');
    }

    const valid = await this.usersService.verifyPassword(user, body.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken);
    const stored = this.refreshTokens.get(payload.sub);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const accessToken = await this.signAccessToken({
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
    });
    return { accessToken };
  }

  logout(userId: string) {
    this.refreshTokens.delete(userId);
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.usersService.sanitize(user);
  }

  async updateMe(userId: string, body: UpdateMeDto) {
    const user = await this.usersService.update(userId, body);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.usersService.sanitize(user);
  }

  async changePassword(userId: string, body: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const valid = await this.usersService.verifyPassword(
      user,
      body.currentPassword,
    );
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.usersService.setPassword(userId, body.newPassword);
    return { changed: true };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const phone = normalizePhone(body.phone);
    const user = await this.usersService.findByPhone(phone);

    if (user) {
      const { response } = await this.otpService.createOtp(
        phone,
        'reset_password',
      );
      return response;
    }

    return {
      otpSent: true,
      expiresIn: 300,
    };
  }

  async resetPassword(body: ResetPasswordDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const phone = normalizePhone(body.phone);
    await this.otpService.verifyOtp(phone, 'reset_password', body.otp);

    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.usersService.setPassword(String(user.id), body.password);
    return { reset: true };
  }

  private async issueAuthResponse(
    user: Awaited<ReturnType<UsersService['findById']>>,
    customer?: Record<string, unknown>,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: AuthUser = {
      sub: String(user.id),
      role: user.role,
      email: user.email,
    };
    const accessToken = await this.signAccessToken(payload);
    const refreshToken = await this.signRefreshToken(payload);
    this.refreshTokens.set(payload.sub, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: this.usersService.sanitize(user),
      ...(customer ? { customer } : {}),
    };
  }

  private signAccessToken(payload: AuthUser): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtSecret(),
      expiresIn: (this.configService.get<string>('jwtExpiresIn') ??
        '15m') as never,
    });
  }

  private signRefreshToken(payload: AuthUser): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtSecret(),
      expiresIn: (this.configService.get<string>('jwtRefreshExpiresIn') ??
        '7d') as never,
    });
  }

  private async verifyToken(token: string): Promise<AuthUser> {
    try {
      return await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.jwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private jwtSecret(): string {
    return this.configService.get<string>('jwtSecret') ?? 'raqi-local-secret';
  }
}
