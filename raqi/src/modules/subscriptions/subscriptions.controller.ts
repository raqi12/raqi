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
import { SubscriptionDto } from '../../common/swagger/schemas/entity.schemas';
import { CustomersService } from '../customers/customers.service';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionStatus } from './schemas/subscription.schema';
import {
  CreateSubscriptionDto,
  RequestSubscriptionDto,
  SubscribePlanDto,
  AdminAssignPlanDto,
  AssignSubscriptionDriverDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';

@ApiTags('Admin - Subscriptions')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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
      'Assigns a plan, bin, and address to a customer. Optionally deducts plan price from wallet.',
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
      'Assigns a default driver to the subscription. Driver must be active and serve the same city and area as the subscription address.',
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
      'Creates an active subscription using plan, bin, and address. Deducts plan price from wallet balance.',
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
      'Returns the customer active or most recent subscription, or null if none exists.',
  })
  @ApiOkDataResponse(SubscriptionDto, 'Current subscription (may be null)')
  async current(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.findCurrentForCustomer(customerId),
    };
  }
}
