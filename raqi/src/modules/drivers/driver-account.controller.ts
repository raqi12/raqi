import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
  UnauthorizedException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  DriverMonthlyStatsDto,
  DriverMonthOptionDto,
  DriverProfileDto,
  DriverVehicleDto,
} from '../../common/swagger/schemas/entity.schemas';
import { AreasService } from '../areas/areas.service';
import { CitiesService } from '../cities/cities.service';
import {
  endOfUtcIsoWeek,
  startOfUtcIsoWeek,
  toUtcDateString,
} from '../subscriptions/subscription.utils';
import { TaskStatus } from '../tasks/schemas/task.schema';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import { DriversService } from './drivers.service';
import { DriverMonthlyStatsQueryDto } from './dto/driver.dto';

@ApiTags('Driver - Account')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Driver)
@Controller('driver')
export class DriverAccountController {
  constructor(
    private readonly driversService: DriversService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
    private readonly citiesService: CitiesService,
    private readonly areasService: AreasService,
  ) {}

  private async resolveDriver(user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const driver = await this.driversService.findByUserId(user.sub);
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    return this.driversService.ensureCode(driver);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Driver account profile (حسابي)',
    description:
      'Returns name, employee code, rating, lifetime completed tasks, and this week’s task totals for the authenticated driver.',
  })
  @ApiOkDataResponse(DriverProfileDto, 'Driver profile with weekly stats')
  async profile(@CurrentUser() user?: AuthUser) {
    const driver = await this.resolveDriver(user);
    const account = await this.usersService.findById(driver.userId);
    if (!account) {
      throw new NotFoundException('User account not found');
    }

    const weekStart = toUtcDateString(startOfUtcIsoWeek());
    const weekEnd = toUtcDateString(endOfUtcIsoWeek());
    const [completedTasksTotal, week] = await Promise.all([
      this.tasksService.countByDriver(String(driver.id), {
        status: TaskStatus.Completed,
      }),
      this.tasksService.getDriverPeriodStats(
        String(driver.id),
        weekStart,
        weekEnd,
      ),
    ]);

    return {
      data: {
        id: String(driver.id),
        code: driver.code,
        name: account.name,
        phone: account.phone ?? null,
        rating: driver.rating ?? null,
        completedTasksTotal,
        week: {
          total: week.total,
          completed: week.completed,
        },
        vehicleNumber: driver.vehicleNumber,
      },
    };
  }

  @Get('stats/months')
  @ApiOperation({
    summary: 'Months with activity (month picker)',
    description:
      'Returns year/month options that have tasks for this driver (plus the current month). Newest first.',
  })
  @ApiOkDataResponse(DriverMonthOptionDto, 'Available months', { isArray: true })
  async listMonths(@CurrentUser() user?: AuthUser) {
    const driver = await this.resolveDriver(user);
    return {
      data: await this.tasksService.listDriverActiveMonths(String(driver.id)),
    };
  }

  @Get('stats/monthly')
  @ApiOperation({
    summary: 'Monthly statistics dashboard (الإحصائيات الشهرية)',
    description:
      'Full monthly dashboard: totals, completion/commitment rates, work hours, current-week daily chart, rating, and achievement. distanceKm and wasteTons are null until tracked.',
  })
  @ApiOkDataResponse(DriverMonthlyStatsDto, 'Driver monthly dashboard')
  async monthlyStats(
    @Query() query: DriverMonthlyStatsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const driver = await this.resolveDriver(user);
    const now = new Date();
    const year = query.year ?? now.getUTCFullYear();
    const month = query.month ?? now.getUTCMonth() + 1;
    return {
      data: await this.tasksService.getDriverMonthlyDashboard(
        String(driver.id),
        year,
        month,
        driver.rating ?? null,
      ),
    };
  }

  @Get('vehicle')
  @ApiOperation({
    summary: 'Vehicle information (معلومات المركبة)',
    description:
      'Returns vehicle number and service city/area for the authenticated driver.',
  })
  @ApiOkDataResponse(DriverVehicleDto, 'Driver vehicle info')
  async vehicle(@CurrentUser() user?: AuthUser) {
    const driver = await this.resolveDriver(user);
    const [city, area] = await Promise.all([
      this.citiesService.findById(driver.cityId),
      this.areasService.findById(driver.areaId),
    ]);
    return {
      data: {
        vehicleNumber: driver.vehicleNumber,
        cityId: driver.cityId,
        cityName: city?.name ?? '—',
        areaId: driver.areaId,
        areaName: area?.name ?? '—',
        status: driver.status,
      },
    };
  }
}
