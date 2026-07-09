import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import type { AuthUser } from '../../common/auth-user.interface';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
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
  async register(@Body() body: RegisterDto) {
    return { data: await this.authService.register(body) };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return { data: await this.authService.verifyOtp(body) };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return { data: await this.authService.login(body) };
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return { data: await this.authService.refresh(body.refreshToken) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: this.authService.logout(user.sub) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.me(user.sub) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Body() body: UpdateMeDto, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.authService.updateMe(user.sub, body) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
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
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return { data: await this.authService.forgotPassword(body) };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return { data: await this.authService.resetPassword(body) };
  }
}
