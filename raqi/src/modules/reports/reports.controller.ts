import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import {
  ApiAdminAuth,
  ApiOkDataResponse,
} from '../../common/swagger/decorators';
import { OverviewReportDto } from '../../common/swagger/schemas/entity.schemas';
import { ReportsService } from './reports.service';

@ApiTags('Admin - Reports')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Overview KPI report',
    description:
      'Dashboard metrics: active subscriptions, completed tasks, total revenue, and generation timestamp.',
  })
  @ApiOkDataResponse(OverviewReportDto, 'Overview report')
  async overview() {
    return { data: await this.reportsService.overview() };
  }
}
