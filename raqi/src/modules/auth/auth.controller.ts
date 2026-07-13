import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiOkDataResponse,
  ApiOkEnvelopeResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  LogoutDataDto,
  MessageDataDto,
  OtpSentDataDto,
} from '../../common/swagger/responses/error.response';
import {
  AuthTokensDto,
  RefreshTokenDataDto,
  RegisterPendingDto,
  UserDto,
} from '../../common/swagger/schemas/entity.schemas';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  DeactivateAccountDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  LoginDto,
  ReactivateAccountDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateMeDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register customer (step 1 — send OTP)',
    description:
      'Starts customer self-registration. Requires a valid `cityId` and `areaId` (resolve via `GET /cities` and `GET /areas?cityId=`). Validates phone uniqueness and location, sends OTP via SMS, and stores the pending registration payload. Complete with `POST /auth/verify-otp`.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiOkDataResponse(RegisterPendingDto, 'OTP sent successfully', { status: 201 })
  @ApiStandardErrorResponses()
  async register(@Body() body: RegisterDto) {
    return { data: await this.authService.register(body) };
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify registration OTP (step 2)',
    description:
      'Verifies OTP for purpose `register`, creates user + customer profile + active address (including `cityId` and `areaId` from step 1) + wallet, and returns JWT tokens.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkDataResponse(AuthTokensDto, 'Registration completed, tokens issued')
  @ApiStandardErrorResponses()
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return { data: await this.authService.verifyOtp(body) };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email or phone',
    description:
      'Staff users login with email. Customers may login with verified phone. Returns access + refresh tokens and user profile.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkDataResponse(AuthTokensDto, 'Authentication successful')
  @ApiStandardErrorResponses()
  async login(@Body() body: LoginDto) {
    return { data: await this.authService.login(body) };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange a valid refresh token for a new access token.',
  })
  @ApiBody({ type: RefreshDto })
  @ApiOkDataResponse(RefreshTokenDataDto, 'New access token issued')
  @ApiStandardErrorResponses()
  async refresh(@Body() body: RefreshDto) {
    return { data: await this.authService.refresh(body.refreshToken) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({
    summary: 'Logout current session',
    description: 'Invalidates the stored refresh token for the authenticated user.',
  })
  @ApiBearerAuth('access-token')
  @ApiStandardErrorResponses()
  @ApiOkDataResponse(LogoutDataDto, 'Logged out successfully')
  logout(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: this.authService.logout(user.sub) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns sanitized profile for the authenticated JWT subject.',
  })
  @ApiBearerAuth('access-token')
  @ApiStandardErrorResponses()
  @ApiOkDataResponse(UserDto, 'Current user profile')
  async me(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.me(user.sub) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates name and/or email for the authenticated user.',
  })
  @ApiBody({ type: UpdateMeDto })
  @ApiBearerAuth('access-token')
  @ApiStandardErrorResponses()
  @ApiOkDataResponse(UserDto, 'Profile updated')
  async updateMe(@Body() body: UpdateMeDto, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.updateMe(user.sub, body) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiOperation({
    summary: 'Change password',
    description: 'Requires current password verification before setting a new password.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiBearerAuth('access-token')
  @ApiStandardErrorResponses()
  @ApiOkEnvelopeResponse('Password changed', { changed: true })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.changePassword(user.sub, body) };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      'Sends OTP to registered phone if account exists. Always returns success shape to prevent user enumeration.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkDataResponse(OtpSentDataDto, 'OTP dispatch result')
  @ApiStandardErrorResponses()
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return { data: await this.authService.forgotPassword(body) };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password with OTP',
    description: 'Verifies reset OTP and sets a new password for the phone account.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkEnvelopeResponse('Password reset successful', { reset: true })
  @ApiStandardErrorResponses()
  async resetPassword(@Body() body: ResetPasswordDto) {
    return { data: await this.authService.resetPassword(body) };
  }
}

@ApiTags('Customer - Account')
@Controller('customer/account')
export class CustomerAccountController {
  constructor(private readonly authService: AuthService) {}

  @Post('reactivate')
  @ApiOperation({
    summary: 'Reactivate frozen account',
    description:
      'Restores a temporarily deactivated customer account and issues new tokens.',
  })
  @ApiBody({ type: ReactivateAccountDto })
  @ApiOkDataResponse(AuthTokensDto, 'Account reactivated')
  @ApiStandardErrorResponses()
  async reactivate(@Body() body: ReactivateAccountDto) {
    return { data: await this.authService.reactivateAccount(body) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @Post('deactivate')
  @ApiOperation({
    summary: 'Temporarily deactivate account',
    description:
      'Freezes the customer account, suspends the active subscription, and invalidates refresh tokens.',
  })
  @ApiBody({ type: DeactivateAccountDto })
  @ApiOkEnvelopeResponse('Account deactivated', { deactivated: true })
  @ApiStandardErrorResponses()
  async deactivate(
    @Body() body: DeactivateAccountDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.deactivateAccount(user.sub, body) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @Post('delete/request-otp')
  @ApiOperation({
    summary: 'Request OTP for account deletion',
    description:
      'Sends a one-time code to the customer verified phone. In dev/test, the fixed code is returned in `data.otp` and `data.debugOtp` (currently `123456`) until SMS is integrated.',
  })
  @ApiOkDataResponse(OtpSentDataDto, 'OTP sent')
  @ApiStandardErrorResponses()
  async requestDeleteOtp(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.requestAccountDeletionOtp(user.sub) };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @Post('delete')
  @ApiOperation({
    summary: 'Permanently delete account',
    description:
      'Requires password and OTP confirmation. Anonymizes user data, suspends subscription, and invalidates sessions.',
  })
  @ApiBody({ type: DeleteAccountDto })
  @ApiOkEnvelopeResponse('Account deleted', { deleted: true })
  @ApiStandardErrorResponses()
  async deleteAccount(
    @Body() body: DeleteAccountDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.deleteAccount(user.sub, body) };
  }
}
