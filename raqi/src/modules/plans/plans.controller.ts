import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@ApiTags('Plans')
@Controller('plans')
export class PublicPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async list() {
    return { data: await this.plansService.findActive() };
  }
}

@ApiTags('Admin - Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async list() {
    return { data: await this.plansService.findAll() };
  }

  @Post()
  async create(@Body() body: CreatePlanDto) {
    return { data: await this.plansService.create(body) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    const plan = await this.plansService.update(id, body);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return { data: plan };
  }
}
