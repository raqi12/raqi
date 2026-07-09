import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import { UsersService } from '../users/users.service';
import { CustomersService } from './customers.service';
import { WalletsService } from '../wallets/wallets.service';
import { AdminCreditWalletDto } from '../wallets/dto/wallet.dto';
import {
  CreateAddressDto,
  CreateCustomerDto,
  UpdateAddressDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@ApiTags('Admin - Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  @Roles(Role.Admin)
  @Get()
  async list() {
    return { data: await this.customersService.findAll() };
  }

  @Roles(Role.Admin)
  @Post()
  async create(@Body() body: CreateCustomerDto) {
    const existing = await this.usersService.findByEmail(body.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    const user = await this.usersService.create({
      email: body.email,
      name: body.name,
      password: body.password,
      role: Role.Customer,
    });
    const customer = await this.customersService.create({
      userId: String(user.id),
      type: body.type ?? 'home',
    });
    await this.walletsService.ensureWallet(String(customer.id));
    return { data: customer };
  }

  @Roles(Role.Admin)
  @Post(':id/wallet/deposit')
  async depositWallet(@Param('id') id: string, @Body() body: AdminCreditWalletDto) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    await this.walletsService.ensureWallet(id);
    const wallet = await this.walletsService.credit(id, body.amount);
    if (!wallet) {
      throw new BadRequestException('Failed to credit wallet');
    }
    return { data: wallet };
  }

  @Roles(Role.Admin)
  @Get(':id/addresses')
  async listAddresses(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { data: await this.customersService.listAddresses(id) };
  }

  @Roles(Role.Admin)
  @Get(':id/wallet')
  async getWallet(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const wallet = await this.walletsService.ensureWallet(id);
    return { data: wallet };
  }

  @Roles(Role.Admin)
  @Get(':id')
  async get(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { data: customer };
  }

  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    const customer = await this.customersService.update(id, body);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { data: customer };
  }
}

@ApiTags('Customer - Addresses')
@ApiBearerAuth()
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
  async list(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.customersService.listAddresses(customerId) };
  }

  @Post()
  async create(@Body() body: CreateAddressDto, @CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.customersService.createAddress(customerId, body) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAddressDto) {
    const address = await this.customersService.updateAddress(id, body);
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return { data: address };
  }
}
