import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import {
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { PlanDto } from '../../common/swagger/schemas/entity.schemas';
import { PlansService } from './plans.service';
import { CreatePlanDto, ListPlansQueryDto, SubscriptionCostDto, UpdatePlanDto } from './dto/plan.dto';

@ApiTags('Plans')
@Controller('plans')
export class PublicPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'List active plans',
    description: 'Public catalog of subscription plans available for purchase. No authentication required.',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    enum: ['home', 'commercial', 'industrial'],
    description: 'Filter plans by activity type',
  })
  @ApiOkDataResponse(PlanDto, 'Active plan list', { isArray: true })
  @ApiStandardErrorResponses()
  async list(@Query() query: ListPlansQueryDto) {
    return {
      data: await this.plansService.findActive({
        activityType: query.activityType,
      }),
    };
  }

  @Get(':planId/cost')
  @ApiOperation({
    summary: 'Calculate subscription cost',
    description:
      'Returns plan price, optional bin fee, and total cost. Bin selection is optional.',
  })
  @ApiQuery({
    name: 'binId',
    required: false,
    description: 'Optional bin MongoDB ID to include bin fee in total',
  })
  @ApiOkDataResponse(SubscriptionCostDto, 'Subscription cost breakdown')
  @ApiStandardErrorResponses()
  async cost(
    @Param('planId') planId: string,
    @Query('binId') binId?: string,
  ) {
    return { data: await this.plansService.calculateCost(planId, binId) };
  }
}

@ApiTags('Admin - Plans')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'List all plans',
    description: 'Returns the full plan catalog including inactive plans. Admin role required.',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    enum: ['home', 'commercial', 'industrial'],
    description: 'Filter plans by activity type',
  })
  @ApiOkDataResponse(PlanDto, 'Plan list', { isArray: true })
  async list(@Query() query: ListPlansQueryDto) {
    return {
      data: await this.plansService.findAll({
        activityType: query.activityType,
      }),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create plan',
    description: 'Adds a new subscription plan to the catalog.',
  })
  @ApiBody({ type: CreatePlanDto })
  @ApiOkDataResponse(PlanDto, 'Plan created', { status: 201 })
  async create(@Body() body: CreatePlanDto) {
    return { data: await this.plansService.create(body) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan' })
  @ApiMongoIdParam('id', 'Plan MongoDB ID')
  @ApiBody({ type: UpdatePlanDto })
  @ApiOkDataResponse(PlanDto, 'Plan updated')
  async update(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    const plan = await this.plansService.update(id, body);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return { data: plan };
  }
}
