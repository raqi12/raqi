import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { RolesGuard } from '../../common/roles.guard';
import { ApiAdminAuth, ApiOkDataResponse } from '../../common/swagger/decorators';
import {
  FinanceMovementsDto,
  FinanceMovementsQueryDto,
  FinancePeriodQueryDto,
  FinancePositionDto,
  FinanceStatementDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Admin - Finance')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('position')
  @ApiOperation({
    summary: 'Current finance position',
    description:
      'Snapshot of money held in customer wallets and the plan value of active subscriptions.',
  })
  @ApiOkDataResponse(FinancePositionDto, 'Finance position')
  async position() {
    return { data: await this.financeService.position() };
  }

  @Get('statement')
  @ApiOperation({
    summary: 'Finance statement for a period',
    description:
      'Money in, money out, and a breakdown by wallet-ledger type between from and to. Defaults to the current calendar month.',
  })
  @ApiOkDataResponse(FinanceStatementDto, 'Finance statement')
  async statement(@Query() query: FinancePeriodQueryDto) {
    return { data: await this.financeService.statement(query) };
  }

  @Get('movements')
  @ApiOperation({
    summary: 'Ledger movements for a period',
    description:
      'Paginated wallet ledger lines between from and to, optionally filtered by movement type.',
  })
  @ApiOkDataResponse(FinanceMovementsDto, 'Finance movements')
  async movements(@Query() query: FinanceMovementsQueryDto) {
    return { data: await this.financeService.movements(query) };
  }
}
