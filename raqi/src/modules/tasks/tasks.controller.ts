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
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  DriverTaskViewDto,
  DriverTodayTasksDto,
  TaskDto,
} from '../../common/swagger/schemas/entity.schemas';
import { CustomersService } from '../customers/customers.service';
import { DriversService } from '../drivers/drivers.service';
import { TasksService } from './tasks.service';
import {
  AssignTaskDto,
  CompleteTaskDto,
  DriverTodayTasksQueryDto,
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get task by ID',
    description: 'Returns a single collection task by its MongoDB ID.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiOkDataResponse(TaskDto, 'Task details')
  async get(@Param('id') id: string) {
    const task = await this.tasksService.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: task };
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate tasks for date and area',
    description:
      'Creates pending collection tasks for active subscriptions in the given area whose collectionDates include the specified date. Skips dates that already have a task.',
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

  private async resolveOwnedTask(id: string, user?: AuthUser) {
    const driverId = await this.resolveDriverId(user);
    const task = await this.tasksService.findById(id);
    if (!task || String(task.driverId) !== driverId) {
      throw new NotFoundException('Task not found');
    }
    return { driverId, task };
  }

  @Get('today')
  @ApiOperation({
    summary: "Today's task schedule (جدول مهام اليوم)",
    description:
      'Returns enriched tasks for today with tab counts (الكل / جارية / مكتملة / قادمة). Optional status filter matches UI tabs: all, upcoming (assigned), in_progress, completed.',
  })
  @ApiOkDataResponse(DriverTodayTasksDto, "Driver's today schedule with counts")
  async today(
    @Query() query: DriverTodayTasksQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const driverId = await this.resolveDriverId(user);
    return {
      data: await this.tasksService.getDriverTodaySchedule(
        driverId,
        query.status ?? 'all',
      ),
    };
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'List future-dated tasks',
    description:
      'Returns enriched tasks assigned to the driver with scheduledDate after today (UTC), sorted ascending.',
  })
  @ApiOkDataResponse(DriverTaskViewDto, "Driver's upcoming tasks", {
    isArray: true,
  })
  async upcoming(@CurrentUser() user?: AuthUser) {
    const driverId = await this.resolveDriverId(user);
    const today = this.tasksService.todayDateString();
    const tasks = await this.tasksService.findByDriverUpcoming(driverId, today);
    return { data: await this.tasksService.enrichTasks(tasks) };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get task details (التفاصيل)',
    description:
      'Returns enriched task details for the assigned driver (address, area, bin, time window, instructions).',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiOkDataResponse(DriverTaskViewDto, 'Task details')
  async get(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    const { task } = await this.resolveOwnedTask(id, user);
    return { data: await this.tasksService.enrichTask(task) };
  }

  @Patch(':id/start')
  @ApiOperation({
    summary: 'Start task (بدء المهمة)',
    description:
      'Marks an assigned task as in progress. Only the assigned driver may start it.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiOkDataResponse(DriverTaskViewDto, 'Task started')
  async start(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    await this.resolveOwnedTask(id, user);
    const task = await this.tasksService.start(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: await this.tasksService.enrichTask(task) };
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Confirm collection (تأكيد الجمع)',
    description:
      'Marks the task as completed. Optional photo and note. Only the assigned driver may complete it; status must be assigned or in_progress.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiBody({ type: CompleteTaskDto })
  @ApiOkDataResponse(DriverTaskViewDto, 'Task completed')
  async complete(
    @Param('id') id: string,
    @Body() body: CompleteTaskDto,
    @CurrentUser() user?: AuthUser,
  ) {
    await this.resolveOwnedTask(id, user);
    const task = await this.tasksService.complete(id, body);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: await this.tasksService.enrichTask(task) };
  }

  @Patch(':id/skip')
  @ApiOperation({
    summary: 'Report problem / cannot collect',
    description:
      'Closes the stop as skipped when collection cannot be completed. Requires reason and GPS location; optional photo evidence.',
  })
  @ApiMongoIdParam('id', 'Task MongoDB ID')
  @ApiBody({ type: SkipTaskDto })
  @ApiOkDataResponse(DriverTaskViewDto, 'Problem reported; task skipped')
  async skip(
    @Param('id') id: string,
    @Body() body: SkipTaskDto,
    @CurrentUser() user?: AuthUser,
  ) {
    await this.resolveOwnedTask(id, user);
    const task = await this.tasksService.skip(id, body);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return { data: await this.tasksService.enrichTask(task) };
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
