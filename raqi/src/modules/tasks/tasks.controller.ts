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
import { DriversService } from '../drivers/drivers.service';
import { TasksService } from './tasks.service';
import {
  AssignTaskDto,
  CompleteTaskDto,
  GenerateTasksDto,
  SkipTaskDto,
} from './dto/task.dto';

@ApiTags('Admin - Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/tasks')
export class AdminTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async list() {
    return { data: await this.tasksService.findAll() };
  }

  @Post('generate')
  async generate(@Body() body: GenerateTasksDto) {
    return { data: await this.tasksService.generate(body.date, body.areaId) };
  }

  @Patch(':id/assign')
  async assign(@Param('id') id: string, @Body() body: AssignTaskDto) {
    const task = await this.tasksService.assign(id, body.driverId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }
}

@ApiTags('Driver - Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Driver)
@Controller('driver/tasks')
export class DriverTasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly driversService: DriversService,
  ) {}

  private async resolveDriverId(user?: AuthUser): Promise<string> {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const drivers = await this.driversService.findAll();
    const driver = drivers.find((item) => item.userId === user.sub);
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    return String(driver.id);
  }

  @Get('today')
  async today(@CurrentUser() user?: AuthUser) {
    const driverId = await this.resolveDriverId(user);
    return { data: await this.tasksService.findByDriver(driverId) };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const task = await this.tasksService.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Patch(':id/start')
  async start(@Param('id') id: string) {
    const task = await this.tasksService.start(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @Body() body: CompleteTaskDto) {
    const task = await this.tasksService.complete(id, body);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Patch(':id/skip')
  async skip(@Param('id') id: string, @Body() body: SkipTaskDto) {
    const task = await this.tasksService.skip(id, body);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }
}

@ApiTags('Customer - Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/tasks')
export class CustomerTasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async history(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const customer = await this.customersService.findByUserId(user.sub);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return {
      data: await this.tasksService.findByCustomer(String(customer.id)),
    };
  }
}
