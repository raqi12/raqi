import {
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
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  CustomerSubscriptionCurrentDto,
  SubscriptionDto,
  AdditionalCollectionSettingsDto,
  AdditionalCollectionPriceDto,
} from '../../common/swagger/schemas/entity.schemas';
import { CustomersService } from '../customers/customers.service';
import { AdditionalCollectionSettingsService } from './additional-collection-settings.service';
import { SubscriptionRenewalService } from './subscription-renewal.service';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionStatus } from './schemas/subscription.schema';
import {
  CreateSubscriptionDto,
  RequestSubscriptionDto,
  SubscribePlanDto,
  AdminAssignPlanDto,
  AssignSubscriptionDriverDto,
  UpdateSubscriptionDto,
  UpdateAutoRenewDto,
  RequestAdditionalCollectionDto,
  UpdateAdditionalCollectionSettingsDto,
  ReplaceBinDto,
} from './dto/subscription.dto';

@ApiTags('Admin - Subscriptions')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionRenewalService: SubscriptionRenewalService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all subscriptions',
    description: 'Returns every subscription record across all customers.',
  })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription list', { isArray: true })
  async list() {
    return { data: await this.subscriptionsService.findAll() };
  }

  @Post()
  @ApiOperation({
    summary: 'Create draft subscription',
    description:
      'Creates a subscription in draft status. addressId is required; city and area are derived from the address.',
  })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription created', { status: 201 })
  async create(@Body() body: CreateSubscriptionDto) {
    return {
      data: await this.subscriptionsService.create(
        body,
        SubscriptionStatus.Draft,
      ),
    };
  }

  @Post('assign-plan')
  @ApiOperation({
    summary: 'Assign plan to customer',
    description:
      'Assigns a plan and address to a customer with exact collectionDates (count must equal plan.numberOfCollections). Creates collection tasks upfront. Bin is optional; when provided, bin fee is included in optional wallet deduction.',
  })
  @ApiBody({ type: AdminAssignPlanDto })
  @ApiOkDataResponse(SubscriptionDto, 'Plan assigned and subscription created')
  async assignPlan(@Body() body: AdminAssignPlanDto) {
    const { customerId, deductWallet, ...planInput } = body;
    return {
      data: await this.subscriptionsService.assignPlan(
        customerId,
        planInput,
        { deductWallet: deductWallet ?? false },
      ),
    };
  }

  @Post('run-renewals')
  @ApiOperation({
    summary: 'Run subscription renewals',
    description:
      'Manually processes due auto-renew subscriptions (same logic as the daily cron job).',
  })
  async runRenewals() {
    return { data: await this.subscriptionRenewalService.processDueRenewals() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiOkDataResponse(SubscriptionDto, 'Subscription details')
  async get(@Param('id') id: string) {
    const subscription = await this.subscriptionsService.findById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return { data: subscription };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update draft subscription',
    description:
      'Updates plan, address, bin, or payment status on a draft or requested subscription.',
  })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiBody({ type: UpdateSubscriptionDto })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription updated')
  async update(@Param('id') id: string, @Body() body: UpdateSubscriptionDto) {
    return { data: await this.subscriptionsService.update(id, body) };
  }

  @Patch(':id/assign-driver')
  @ApiOperation({
    summary: 'Assign driver to subscription',
    description:
      'Assigns a default driver to the subscription and attaches that driver to all open collection tasks. Driver must be active and serve the same city and area as the subscription address.',
  })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiBody({ type: AssignSubscriptionDriverDto })
  @ApiOkDataResponse(SubscriptionDto, 'Driver assigned to subscription')
  async assignDriver(
    @Param('id') id: string,
    @Body() body: AssignSubscriptionDriverDto,
  ) {
    return {
      data: await this.subscriptionsService.assignDriver(id, body.driverId),
    };
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate subscription',
    description: 'Transitions a subscription to active status.',
  })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiOkDataResponse(SubscriptionDto, 'Subscription activated')
  async activate(@Param('id') id: string) {
    return { data: await this.subscriptionsService.activate(id) };
  }

  @Patch(':id/suspend')
  @ApiOperation({
    summary: 'Suspend subscription',
    description: 'Suspends an active subscription.',
  })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiOkDataResponse(SubscriptionDto, 'Subscription suspended')
  async suspend(@Param('id') id: string) {
    const subscription = await this.subscriptionsService.setStatus(
      id,
      SubscriptionStatus.Suspended,
    );
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return { data: subscription };
  }

  @Patch(':id/renew')
  @ApiOperation({
    summary: 'Renew subscription',
    description: 'Reactivates a subscription and records renewal timestamp.',
  })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiOkDataResponse(SubscriptionDto, 'Subscription renewed')
  async renew(@Param('id') id: string) {
    const subscription = await this.subscriptionsService.setStatus(
      id,
      SubscriptionStatus.Active,
      { renewedAt: new Date() },
    );
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return { data: subscription };
  }

  @Post(':id/replace-bin')
  @ApiOperation({
    summary: 'Replace subscription bin',
    description:
      'Swaps the subscription bin with another available bin. Delivery date stays the subscription start date. No wallet charge.',
  })
  @ApiMongoIdParam('id', 'Subscription MongoDB ID')
  @ApiBody({ type: ReplaceBinDto })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription bin replaced')
  async replaceBin(@Param('id') id: string, @Body() body: ReplaceBinDto) {
    return {
      data: await this.subscriptionsService.replaceBin(id, body.newBinId),
    };
  }
}

@ApiTags('Admin - Additional Collection')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/settings')
export class AdminAdditionalCollectionSettingsController {
  constructor(
    private readonly additionalCollectionSettingsService: AdditionalCollectionSettingsService,
  ) {}

  @Get('additional-collection')
  @ApiOperation({
    summary: 'Get additional collection settings',
    description:
      'Returns the fixed price customers pay for an extra collection during an active subscription.',
  })
  @ApiOkDataResponse(
    AdditionalCollectionSettingsDto,
    'Additional collection settings (may be null)',
  )
  async getSettings() {
    return {
      data: await this.additionalCollectionSettingsService.getOrEmpty(),
    };
  }

  @Patch('additional-collection')
  @ApiOperation({
    summary: 'Update additional collection settings',
    description:
      'Sets the fixed wallet charge for requesting an additional collection day.',
  })
  @ApiBody({ type: UpdateAdditionalCollectionSettingsDto })
  @ApiOkDataResponse(
    AdditionalCollectionSettingsDto,
    'Additional collection settings updated',
  )
  async updateSettings(@Body() body: UpdateAdditionalCollectionSettingsDto) {
    return {
      data: await this.additionalCollectionSettingsService.upsert(body),
    };
  }
}

@ApiTags('Customer - Subscriptions')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/subscriptions')
export class CustomerSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
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

  @Post('subscribe')
  @ApiOperation({
    summary: 'Subscribe with wallet',
    description:
      'Creates an active subscription using plan, address, and collectionDates (count must equal plan.numberOfCollections). Creates collection tasks upfront. Bin is optional; when provided, bin fee is added to the wallet debit.',
  })
  @ApiBody({ type: SubscribePlanDto })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription created via wallet payment')
  async subscribe(
    @Body() body: SubscribePlanDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.subscribeWithWallet(
        customerId,
        body,
      ),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Request subscription',
    description:
      'Submits a subscription request for admin review. addressId is required; city and area are derived from the address.',
  })
  @ApiBody({ type: RequestSubscriptionDto })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription request submitted', {
    status: 201,
  })
  async request(
    @Body() body: RequestSubscriptionDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.create(
        { ...body, customerId },
        SubscriptionStatus.Requested,
      ),
    };
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current subscription',
    description:
      'Returns the customer active or most recent subscription with plan summary, or null if none exists.',
  })
  @ApiOkDataResponse(CustomerSubscriptionCurrentDto, 'Current subscription (may be null)')
  async current(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.getCurrentWithPlan(customerId),
    };
  }

  @Get('additional-collection/price')
  @ApiOperation({
    summary: 'Get additional collection price',
    description:
      'Returns the fixed dashboard-configured price for requesting an extra collection day.',
  })
  @ApiOkDataResponse(AdditionalCollectionPriceDto, 'Additional collection price')
  async additionalCollectionPrice() {
    return {
      data: await this.subscriptionsService.getAdditionalCollectionPrice(),
    };
  }

  @Post('current/additional-collection')
  @ApiOperation({
    summary: 'Request additional collection',
    description:
      'Adds one extra collection date within the active subscription period, creates a task, and debits the fixed price from the customer wallet.',
  })
  @ApiBody({ type: RequestAdditionalCollectionDto })
  @ApiOkDataResponse(SubscriptionDto, 'Additional collection scheduled')
  async requestAdditionalCollection(
    @Body() body: RequestAdditionalCollectionDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.requestAdditionalCollection(
        customerId,
        body.collectionDate,
      ),
    };
  }

  @Post('current/replace-bin')
  @ApiOperation({
    summary: 'Replace current subscription bin',
    description:
      'Replaces the active subscription bin with another available bin. Delivery date remains the subscription start date. No wallet charge.',
  })
  @ApiBody({ type: ReplaceBinDto })
  @ApiOkDataResponse(SubscriptionDto, 'Subscription bin replaced')
  async replaceBin(
    @Body() body: ReplaceBinDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.replaceBinForCustomer(
        customerId,
        body.newBinId,
      ),
    };
  }

  @Patch('current/auto-renew')
  @ApiOperation({
    summary: 'Update auto-renew preference',
    description:
      'Enables or disables automatic renewal for the customer active subscription.',
  })
  @ApiBody({ type: UpdateAutoRenewDto })
  @ApiOkDataResponse(SubscriptionDto, 'Auto-renew preference updated')
  async updateAutoRenew(
    @Body() body: UpdateAutoRenewDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.setAutoRenew(
        customerId,
        body.autoRenew,
      ),
    };
  }
}
