import {
  Body,
  Controller,
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
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiOptionalQuery,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { CashTopupRequestDto } from '../../common/swagger/schemas/entity.schemas';
import { CustomersService } from '../customers/customers.service';
import { CashTopupsService } from './cash-topups.service';
import {
  AssignCashTopupCourierDto,
  CancelCashTopupDto,
  CreateCashTopupDto,
  ListCashTopupsQueryDto,
} from './dto/wallet.dto';

@ApiTags('Customer - Cash Topups')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/cash-topups')
export class CustomerCashTopupsController {
  constructor(
    private readonly cashTopupsService: CashTopupsService,
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

  @Post()
  @ApiOperation({
    summary: 'Request cash wallet top-up via courier',
    description:
      'Creates a cash collection request at the selected customer address. Wallet is credited only after admin confirms cash receipt at the company.',
  })
  @ApiBody({ type: CreateCashTopupDto })
  @ApiOkDataResponse(CashTopupRequestDto, 'Cash top-up created', { status: 201 })
  async create(@Body() body: CreateCashTopupDto, @CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.cashTopupsService.create({
        customerId,
        amount: body.amount,
        addressId: body.addressId,
      }),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List my cash top-up requests' })
  @ApiOkDataResponse(CashTopupRequestDto, 'Cash top-up list', { isArray: true })
  async list(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.cashTopupsService.findByCustomer(customerId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash top-up request by ID' })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiOkDataResponse(CashTopupRequestDto, 'Cash top-up details')
  async get(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    const request = await this.cashTopupsService.findByIdOrThrow(id);
    if (String(request.customerId) !== customerId) {
      throw new NotFoundException('Cash top-up request not found');
    }
    return { data: request };
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel pending cash top-up',
    description: 'Customers may cancel only while status is pending.',
  })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiBody({ type: CancelCashTopupDto })
  @ApiOkDataResponse(CashTopupRequestDto, 'Cash top-up cancelled')
  async cancel(
    @Param('id') id: string,
    @Body() body: CancelCashTopupDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.cashTopupsService.cancel(id, {
        actorUserId: user?.sub,
        reason: body.reason,
        allowCustomerPendingOnly: true,
        customerId,
      }),
    };
  }
}

@ApiTags('Admin - Cash Topups')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/cash-topups')
export class AdminCashTopupsController {
  constructor(private readonly cashTopupsService: CashTopupsService) {}

  @Get()
  @ApiOperation({ summary: 'List cash top-up requests' })
  @ApiOptionalQuery('status', 'Filter by status', {
    enum: ['pending', 'dispatched', 'collected', 'completed', 'cancelled'],
  })
  @ApiOkDataResponse(CashTopupRequestDto, 'Cash top-up list', { isArray: true })
  async list(@Query() query: ListCashTopupsQueryDto) {
    return { data: await this.cashTopupsService.findAll(query.status) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash top-up by ID' })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiOkDataResponse(CashTopupRequestDto, 'Cash top-up details')
  async get(@Param('id') id: string) {
    return { data: await this.cashTopupsService.findByIdOrThrow(id) };
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign courier (name/phone only, no login)',
    description: 'Stores courier contact for dispatch. No user role is created.',
  })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiBody({ type: AssignCashTopupCourierDto })
  @ApiOkDataResponse(CashTopupRequestDto, 'Courier assigned')
  async assign(@Param('id') id: string, @Body() body: AssignCashTopupCourierDto) {
    return {
      data: await this.cashTopupsService.assignCourier(id, {
        courierName: body.courierName,
        courierPhone: body.courierPhone,
      }),
    };
  }

  @Patch(':id/dispatch')
  @ApiOperation({
    summary: 'Dispatch courier from company',
    description: 'Marks request as dispatched (courier left the company).',
  })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiOkDataResponse(CashTopupRequestDto, 'Dispatched')
  async dispatch(@Param('id') id: string) {
    return { data: await this.cashTopupsService.dispatch(id) };
  }

  @Patch(':id/collect')
  @ApiOperation({
    summary: 'Mark cash collected from customer',
    description: 'Does not credit the wallet yet.',
  })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiOkDataResponse(CashTopupRequestDto, 'Collected')
  async collect(@Param('id') id: string) {
    return { data: await this.cashTopupsService.collect(id) };
  }

  @Patch(':id/confirm')
  @ApiOperation({
    summary: 'Confirm cash received at company and credit wallet',
    description: 'Only from collected status. Credits customer wallet.',
  })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiOkDataResponse(CashTopupRequestDto, 'Completed and credited')
  async confirm(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.cashTopupsService.confirm(id, user.sub) };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel cash top-up before completion' })
  @ApiMongoIdParam('id', 'Cash top-up MongoDB ID')
  @ApiBody({ type: CancelCashTopupDto })
  @ApiOkDataResponse(CashTopupRequestDto, 'Cancelled')
  async cancel(
    @Param('id') id: string,
    @Body() body: CancelCashTopupDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      data: await this.cashTopupsService.cancel(id, {
        actorUserId: user.sub,
        reason: body.reason,
      }),
    };
  }
}
