import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiOptionalQuery,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  AddressDto,
  CustomerDto,
  CustomerDetailsDto,
  WalletDto,
  WalletTransactionListDto,
} from '../../common/swagger/schemas/entity.schemas';
import { UsersService } from '../users/users.service';
import { CustomersService } from './customers.service';
import { CustomerAdminService } from './customer-admin.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletTransactionsService } from '../wallets/wallet-transactions.service';
import {
  AdminCreditWalletDto,
  ListWalletTransactionsQueryDto,
} from '../wallets/dto/wallet.dto';
import {
  CreateAddressDto,
  CreateCustomerDto,
  UpdateAddressDto,
} from './dto/customer.dto';

@ApiTags('Admin - Customers')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly customerAdminService: CustomerAdminService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly walletTransactionsService: WalletTransactionsService,
  ) {}

  @Roles(Role.Admin)
  @Get()
  @ApiOperation({
    summary: 'List customers',
    description: 'Returns all customer profiles. Admin role required.',
  })
  @ApiOkDataResponse(CustomerDto, 'Customer list', { isArray: true })
  async list() {
    return { data: await this.customersService.findAllForAdmin() };
  }

  @Roles(Role.Admin)
  @Post()
  @ApiOperation({
    summary: 'Create customer',
    description:
      'Creates a customer user account, customer profile (requires `cityId`, `areaId`, `lat`, and `lng`), and initializes an empty wallet. Use `GET /admin/cities` and `GET /admin/areas?cityId=` to resolve valid location IDs.',
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiOkDataResponse(CustomerDto, 'Customer created', { status: 201 })
  async create(@Body() body: CreateCustomerDto) {
    const email = body.email?.trim();
    if (email) {
      const existingEmail = await this.usersService.findByEmail(email);
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }
    const existingPhone = await this.usersService.findByPhone(body.phone);
    if (existingPhone) {
      throw new BadRequestException('Phone already registered');
    }
    const user = await this.usersService.create({
      email,
      phone: body.phone,
      name: body.name,
      password: body.password,
      role: Role.Customer,
      phoneVerified: true,
    });
    const customer = await this.customersService.create({
      userId: String(user.id),
      cityId: body.cityId,
      areaId: body.areaId,
    });
    await this.customersService.createInitialAddress(String(customer.id), {
      cityId: body.cityId,
      areaId: body.areaId,
      lat: body.lat,
      lng: body.lng,
    });
    await this.walletsService.ensureWallet(String(customer.id));
    return {
      data: await this.customersService.findByIdForAdmin(String(customer.id)),
    };
  }

  @Roles(Role.Admin)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete customer account',
    description:
      'Soft-deletes the linked user account so the customer can no longer sign in. Profile history is retained but anonymized.',
  })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiOkDataResponse(CustomerDto, 'Customer account deleted')
  async remove(@Param('id') id: string) {
    return { data: await this.customersService.softDeleteAccount(id) };
  }

  @Roles(Role.Admin)
  @Post(':id/wallet/deposit')
  @ApiOperation({
    summary: 'Credit customer wallet',
    description: 'Admin manual deposit — credits the customer wallet by the given amount.',
  })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiBody({ type: AdminCreditWalletDto })
  @ApiOkDataResponse(WalletDto, 'Wallet credited')
  async depositWallet(
    @Param('id') id: string,
    @Body() body: AdminCreditWalletDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    await this.walletsService.ensureWallet(id);
    const { wallet } = await this.walletsService.applyMovement({
      customerId: id,
      type: 'admin_credit',
      direction: 'credit',
      amount: body.amount,
      referenceType: 'manual',
      description: body.note ?? 'إضافة رصيد يدوية من الإدارة',
      createdBy: user?.sub ?? null,
    });
    return { data: wallet };
  }

  @Roles(Role.Admin)
  @Get(':id/addresses')
  @ApiOperation({ summary: 'List customer addresses' })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiOkDataResponse(AddressDto, 'Customer addresses', { isArray: true })
  async listAddresses(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { data: await this.customersService.listAddresses(id) };
  }

  @Roles(Role.Admin)
  @Get(':id/wallet')
  @ApiOperation({ summary: 'Get customer wallet' })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiOkDataResponse(WalletDto, 'Customer wallet')
  async getWallet(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const wallet = await this.walletsService.ensureWallet(id);
    return { data: wallet };
  }

  @Roles(Role.Admin)
  @Get(':id/wallet/transactions')
  @ApiOperation({
    summary: 'List customer wallet transactions',
    description: 'Returns paginated wallet transaction history for a customer.',
  })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiOptionalQuery('page', 'Page number (1-based)', { type: 'number', example: 1 })
  @ApiOptionalQuery('limit', 'Items per page (max 100)', { type: 'number', example: 20 })
  @ApiOptionalQuery('type', 'Filter by transaction type', {
    enum: ['deposit', 'admin_credit', 'subscription_payment', 'refund'],
    example: 'deposit',
  })
  @ApiOkDataResponse(WalletTransactionListDto, 'Wallet transaction list')
  async listWalletTransactions(
    @Param('id') id: string,
    @Query() query: ListWalletTransactionsQueryDto,
  ) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return {
      data: await this.walletTransactionsService.findByCustomer(id, query),
    };
  }

  @Roles(Role.Admin)
  @Get(':id/details')
  @ApiOperation({
    summary: 'Get full customer profile',
    description:
      'Returns customer profile with wallet, addresses, subscriptions, payments, deposit requests, bins, tasks, and complaints.',
  })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiOkDataResponse(CustomerDetailsDto, 'Customer full details')
  async getDetails(@Param('id') id: string) {
    return { data: await this.customerAdminService.getDetails(id) };
  }

  @Roles(Role.Admin)
  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiMongoIdParam('id', 'Customer MongoDB ID')
  @ApiOkDataResponse(CustomerDto, 'Customer details')
  async get(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { data: await this.customersService.findByIdForAdmin(id) };
  }
}

@ApiTags('Customer - Addresses')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/addresses')
export class CustomerAddressesController {
  constructor(private readonly customersService: CustomersService) {}

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

  @Get()
  @ApiOperation({
    summary: 'List my addresses',
    description: 'Returns delivery addresses for the authenticated customer.',
  })
  @ApiOkDataResponse(AddressDto, 'Address list', { isArray: true })
  async list(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.customersService.listAddresses(customerId) };
  }

  @Post()
  @ApiOperation({
    summary: 'Add address',
    description:
      'Creates a new delivery address with cityId and areaId. Not active by default; use PATCH /customer/addresses/:id/activate to set primary.',
  })
  @ApiBody({ type: CreateAddressDto })
  @ApiOkDataResponse(AddressDto, 'Address created', { status: 201 })
  async create(@Body() body: CreateAddressDto, @CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.customersService.createAddress(customerId, body) };
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Set active address',
    description:
      'Marks this address as the customer primary service location and syncs customer cityId/areaId.',
  })
  @ApiMongoIdParam('id', 'Address MongoDB ID')
  @ApiOkDataResponse(AddressDto, 'Address activated')
  async activate(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.customersService.setActiveAddress(customerId, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address' })
  @ApiMongoIdParam('id', 'Address MongoDB ID')
  @ApiBody({ type: UpdateAddressDto })
  @ApiOkDataResponse(AddressDto, 'Address updated')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAddressDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    const existing = await this.customersService.findAddressById(id);
    if (!existing || String(existing.customerId) !== customerId) {
      throw new NotFoundException('Address not found');
    }
    const address = await this.customersService.updateAddress(id, body);
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return { data: address };
  }
}
