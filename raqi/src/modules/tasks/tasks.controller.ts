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
import { TaskDto } from '../../common/swagger/schemas/entity.schemas';
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
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/tasks')
export class AdminTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({
    summary: 'List all tasks',
    description: 'Returns collection tasks across all areas and drivers.',
  })
  @ApiOkDataResponse(TaskDto, 'Task list', { isArray: true })
  async list() {
    return { data: await this.tasksService.findAll() };
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate tasks for date and area',
    description:
      'Creates pending collection tasks for active subscriptions in the given area on the specified date.',
  })
  @ApiBody({ type: GenerateTasksDto })
  @ApiOkDataResponse(TaskDto, 'Generated tasks', { isArray: true })
  async generate(@Body() body: GenerateTasksDto) {
    return { data: await this.tasksService.generate(body.date, body.areaId) };
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign task to driver',
    description: 'Assigns a pending task to a driver for execution.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiBody({ type: AssignTaskDto })
  @ApiOkDataResponse(TaskDto, 'Task assigned')
  async assign(@Param('id') id: string, @Body() body: AssignTaskDto) {
    const task = await this.tasksService.assign(id, body.driverId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }
}

@ApiTags('Driver - Tasks')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
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
  @ApiOperation({
    summary: "List today's tasks",
    description: 'Returns tasks assigned to the authenticated driver.',
  })
  @ApiOkDataResponse(TaskDto, "Driver's task list", { isArray: true })
  async today(@CurrentUser() user?: AuthUser) {
    const driverId = await this.resolveDriverId(user);
    return { data: await this.tasksService.findByDriver(driverId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiOkDataResponse(TaskDto, 'Task details')
  async get(@Param('id') id: string) {
    const task = await this.tasksService.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Patch(':id/start')
  @ApiOperation({
    summary: 'Start task',
    description: 'Marks a task as in progress.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiOkDataResponse(TaskDto, 'Task started')
  async start(@Param('id') id: string) {
    const task = await this.tasksService.start(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Complete task',
    description: 'Marks a task as completed with optional photo and note.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiBody({ type: CompleteTaskDto })
  @ApiOkDataResponse(TaskDto, 'Task completed')
  async complete(@Param('id') id: string, @Body() body: CompleteTaskDto) {
    const task = await this.tasksService.complete(id, body);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Patch(':id/skip')
  @ApiOperation({
    summary: 'Skip task',
    description: 'Marks a task as skipped with reason and location.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiBody({ type: SkipTaskDto })
  @ApiOkDataResponse(TaskDto, 'Task skipped')
  async skip(@Param('id') id: string, @Body() body: SkipTaskDto) {
    const task = await this.tasksService.skip(id, body);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }
}

@ApiTags('Customer - Tasks')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/tasks')
export class CustomerTasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List task history',
    description: 'Returns collection task history for the authenticated customer.',
  })
  @ApiOkDataResponse(TaskDto, 'Customer task history', { isArray: true })
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
