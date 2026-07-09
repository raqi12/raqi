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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import { CustomersService } from '../customers/customers.service';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionStatus } from './schemas/subscription.schema';
import {
  CreateSubscriptionDto,
  RequestSubscriptionDto,
  SubscribePlanDto,
  AdminAssignPlanDto,
} from './dto/subscription.dto';

@ApiTags('Admin - Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async list() {
    return { data: await this.subscriptionsService.findAll() };
  }

  @Post()
  async create(@Body() body: CreateSubscriptionDto) {
    return {
      data: await this.subscriptionsService.create(
        body,
        SubscriptionStatus.Draft,
      ),
    };
  }

  @Post('assign-plan')
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
  async get(@Param('id') id: string) {
    const subscription = await this.subscriptionsService.findById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return { data: subscription };
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return { data: await this.subscriptionsService.activate(id) };
  }

  @Patch(':id/suspend')
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
@ApiBearerAuth()
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
  async current(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.subscriptionsService.findCurrentForCustomer(customerId),
    };
  }
}
