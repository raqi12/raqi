import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import { CustomersService } from '../customers/customers.service';
import { BankAccountSettingsService } from './bank-account-settings.service';
import { DepositRequestsService } from './deposit-requests.service';
import {
  CreateDepositRequestDto,
  ListDepositRequestsQueryDto,
  RejectDepositRequestDto,
  UpdateBankAccountDto,
} from './dto/wallet.dto';
import { WalletsService } from './wallets.service';
import {
  buildEvidenceUrl,
  depositEvidenceFilter,
  depositEvidenceStorage,
} from './upload.config';

@ApiTags('Customer - Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer')
export class CustomerWalletController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly bankAccountSettingsService: BankAccountSettingsService,
    private readonly depositRequestsService: DepositRequestsService,
    private readonly customersService: CustomersService,
  ) {}

  private async resolveCustomerId(user?: AuthUser): Promise<string> {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const customer = await this.customersService.findByUserId(user.sub);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return String(customer.id);
  }

  @Get('wallet')
  async getWallet(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    const wallet = await this.walletsService.ensureWallet(customerId);
    return { data: wallet };
  }

  @Get('bank-account')
  async getBankAccount() {
    const settings = await this.bankAccountSettingsService.getActive();
    if (!settings) {
      throw new NotFoundException('Bank account is not configured yet');
    }
    return { data: settings };
  }

  @Post('deposit-requests')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('evidence', {
      storage: depositEvidenceStorage,
      fileFilter: depositEvidenceFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createDepositRequest(
    @Body() body: CreateDepositRequestDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('Transfer evidence image is required');
    }

    const bankAccount = await this.bankAccountSettingsService.getActive();
    if (!bankAccount) {
      throw new BadRequestException('Bank account is not configured yet');
    }

    const customerId = await this.resolveCustomerId(user);
    await this.walletsService.ensureWallet(customerId);

    const request = await this.depositRequestsService.create({
      customerId,
      amount: body.amount,
      evidenceImageUrl: buildEvidenceUrl(file.filename),
    });

    return { data: request };
  }

  @Get('deposit-requests')
  async listDepositRequests(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.depositRequestsService.findByCustomer(customerId) };
  }
}

@ApiTags('Admin - Wallet Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin')
export class AdminWalletSettingsController {
  constructor(
    private readonly bankAccountSettingsService: BankAccountSettingsService,
    private readonly depositRequestsService: DepositRequestsService,
  ) {}

  @Get('settings/bank-account')
  async getBankAccount() {
    return { data: await this.bankAccountSettingsService.getOrEmpty() };
  }

  @Patch('settings/bank-account')
  async updateBankAccount(@Body() body: UpdateBankAccountDto) {
    return { data: await this.bankAccountSettingsService.upsert(body) };
  }

  @Get('deposit-requests')
  async listDepositRequests(@Query() query: ListDepositRequestsQueryDto) {
    return { data: await this.depositRequestsService.findAll(query.status) };
  }

  @Patch('deposit-requests/:id/approve')
  async approveDepositRequest(
    @Param('id') id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      data: await this.depositRequestsService.approve(id, user.sub),
    };
  }

  @Patch('deposit-requests/:id/reject')
  async rejectDepositRequest(
    @Param('id') id: string,
    @Body() body: RejectDepositRequestDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      data: await this.depositRequestsService.reject(
        id,
        user.sub,
        body.rejectionReason,
      ),
    };
  }
}
