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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiOptionalQuery,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  BankAccountSettingsDto,
  DepositRequestDto,
  WalletBalanceDto,
  WalletDto,
  WalletTransactionListDto,
} from '../../common/swagger/schemas/entity.schemas';
import { DepositEvidenceUploadDto } from '../../common/swagger/schemas/upload.schemas';
import { CustomersService } from '../customers/customers.service';
import { BankAccountSettingsService } from './bank-account-settings.service';
import { DepositRequestsService } from './deposit-requests.service';
import {
  CreateDepositRequestDto,
  ListDepositRequestsQueryDto,
  ListWalletTransactionsQueryDto,
  RejectDepositRequestDto,
  UpdateBankAccountDto,
} from './dto/wallet.dto';
import { WalletTransactionsService } from './wallet-transactions.service';
import { WalletsService } from './wallets.service';
import {
  buildEvidenceUrl,
  depositEvidenceFilter,
  depositEvidenceStorage,
} from './upload.config';

@ApiTags('Customer - Wallet')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer')
export class CustomerWalletController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly walletTransactionsService: WalletTransactionsService,
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
  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Returns the authenticated customer wallet, creating one if needed.',
  })
  @ApiOkDataResponse(WalletDto, 'Wallet details')
  async getWallet(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    const wallet = await this.walletsService.ensureWallet(customerId);
    return { data: wallet };
  }

  @Get('wallet/balance')
  @ApiOperation({
    summary: 'Get wallet balance only',
    description: 'Returns the current wallet balance for the authenticated customer.',
  })
  @ApiOkDataResponse(WalletBalanceDto, 'Wallet balance')
  async getWalletBalance(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    const wallet = await this.walletsService.ensureWallet(customerId);
    return {
      data: {
        balance: wallet.balance,
        currency: 'LYD',
      },
    };
  }

  @Get('wallet/transactions')
  @ApiOperation({
    summary: 'List wallet transactions',
    description: 'Returns paginated wallet transaction history for the authenticated customer.',
  })
  @ApiOptionalQuery('page', 'Page number (1-based)', { type: 'number', example: 1 })
  @ApiOptionalQuery('limit', 'Items per page (max 100)', { type: 'number', example: 20 })
  @ApiOptionalQuery('type', 'Filter by transaction type', {
    enum: ['deposit', 'admin_credit', 'subscription_payment', 'refund'],
    example: 'deposit',
  })
  @ApiOkDataResponse(WalletTransactionListDto, 'Wallet transaction list')
  async listWalletTransactions(
    @Query() query: ListWalletTransactionsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.walletTransactionsService.findByCustomer(customerId, query),
    };
  }

  @Get('bank-account')
  @ApiOperation({
    summary: 'Get active bank account',
    description: 'Returns bank transfer details for wallet deposits.',
  })
  @ApiOkDataResponse(BankAccountSettingsDto, 'Active bank account settings')
  async getBankAccount() {
    const settings = await this.bankAccountSettingsService.getActive();
    if (!settings) {
      throw new NotFoundException('Bank account is not configured yet');
    }
    return { data: settings };
  }

  @Post('deposit-requests')
  @ApiOperation({
    summary: 'Submit deposit request',
    description:
      'Uploads transfer evidence and creates a pending deposit request for admin review.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: DepositEvidenceUploadDto })
  @ApiOkDataResponse(DepositRequestDto, 'Deposit request created', { status: 201 })
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
  @ApiOperation({
    summary: 'List deposit requests',
    description: 'Returns deposit requests submitted by the authenticated customer.',
  })
  @ApiOkDataResponse(DepositRequestDto, 'Deposit request list', { isArray: true })
  async listDepositRequests(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.depositRequestsService.findByCustomer(customerId) };
  }
}

@ApiTags('Customer - Wallet')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('wallet')
export class WalletBalanceController {
  constructor(
    private readonly walletsService: WalletsService,
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

  @Get('balance')
  @ApiOperation({
    summary: 'Get wallet balance (alias)',
    description:
      'Alias of GET /customer/wallet/balance. Returns the authenticated customer wallet balance.',
  })
  @ApiOkDataResponse(WalletBalanceDto, 'Wallet balance')
  async getBalance(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    const wallet = await this.walletsService.ensureWallet(customerId);
    return {
      data: {
        balance: wallet.balance,
        currency: 'LYD',
      },
    };
  }
}

@ApiTags('Admin - Wallet Settings')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin')
export class AdminWalletSettingsController {
  constructor(
    private readonly bankAccountSettingsService: BankAccountSettingsService,
    private readonly depositRequestsService: DepositRequestsService,
  ) {}

  @Get('settings/bank-account')
  @ApiOperation({
    summary: 'Get bank account settings',
    description: 'Returns configured bank account details, or null if not yet set up.',
  })
  @ApiOkDataResponse(BankAccountSettingsDto, 'Bank account settings (may be null)')
  async getBankAccount() {
    return { data: await this.bankAccountSettingsService.getOrEmpty() };
  }

  @Patch('settings/bank-account')
  @ApiOperation({
    summary: 'Update bank account settings',
    description: 'Creates or updates the bank account used for customer wallet deposits.',
  })
  @ApiBody({ type: UpdateBankAccountDto })
  @ApiOkDataResponse(BankAccountSettingsDto, 'Bank account settings updated')
  async updateBankAccount(@Body() body: UpdateBankAccountDto) {
    return { data: await this.bankAccountSettingsService.upsert(body) };
  }

  @Get('deposit-requests')
  @ApiOperation({
    summary: 'List deposit requests',
    description: 'Returns all deposit requests, optionally filtered by status.',
  })
  @ApiOptionalQuery('status', 'Filter by deposit status', {
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
  })
  @ApiOkDataResponse(DepositRequestDto, 'Deposit request list', { isArray: true })
  async listDepositRequests(@Query() query: ListDepositRequestsQueryDto) {
    return { data: await this.depositRequestsService.findAll(query.status) };
  }

  @Patch('deposit-requests/:id/approve')
  @ApiOperation({
    summary: 'Approve deposit request',
    description: 'Approves a pending deposit and credits the customer wallet.',
  })
  @ApiMongoIdParam('id', 'Deposit request MongoDB ID')
  @ApiOkDataResponse(DepositRequestDto, 'Deposit request approved')
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
  @ApiOperation({
    summary: 'Reject deposit request',
    description: 'Rejects a pending deposit request with an optional reason.',
  })
  @ApiMongoIdParam('id', 'Deposit request MongoDB ID')
  @ApiBody({ type: RejectDepositRequestDto })
  @ApiOkDataResponse(DepositRequestDto, 'Deposit request rejected')
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
