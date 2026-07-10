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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { BinDto, BinStatsDto } from '../../common/swagger/schemas/entity.schemas';
import { BinsService } from './bins.service';
import { AssignBinDto, CreateBinDto, UpdateBinDto } from './dto/bin.dto';

@ApiTags('Admin - Bins')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/bins')
export class BinsController {
  constructor(private readonly binsService: BinsService) {}

  @Get()
  @ApiOperation({
    summary: 'List bins',
    description: 'Returns the full bin inventory. Admin role required.',
  })
  @ApiOkDataResponse(BinDto, 'Bin list', { isArray: true })
  async list() {
    return { data: await this.binsService.findAll() };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Bin inventory statistics',
    description: 'Aggregated counts by bin status (available, assigned, maintenance).',
  })
  @ApiOkDataResponse(BinStatsDto, 'Bin statistics')
  async stats() {
    return { data: await this.binsService.getStats() };
  }

  @Post()
  @ApiOperation({
    summary: 'Create bin',
    description: 'Registers a new bin with code, QR identifier, and optional capacity.',
  })
  @ApiBody({ type: CreateBinDto })
  @ApiOkDataResponse(BinDto, 'Bin created', { status: 201 })
  async create(@Body() body: CreateBinDto) {
    return { data: await this.binsService.create(body) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bin by ID' })
  @ApiMongoIdParam('id', 'Bin MongoDB ID')
  @ApiOkDataResponse(BinDto, 'Bin details')
  async get(@Param('id') id: string) {
    const bin = await this.binsService.findById(id);
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bin' })
  @ApiMongoIdParam('id', 'Bin MongoDB ID')
  @ApiBody({ type: UpdateBinDto })
  @ApiOkDataResponse(BinDto, 'Bin updated')
  async update(@Param('id') id: string, @Body() body: UpdateBinDto) {
    const bin = await this.binsService.update(id, body);
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }

  @Post(':id/assign')
  @ApiOperation({
    summary: 'Assign bin to customer',
    description: 'Links a bin to a customer account and optionally marks it active.',
  })
  @ApiMongoIdParam('id', 'Bin MongoDB ID')
  @ApiBody({ type: AssignBinDto })
  @ApiOkDataResponse(BinDto, 'Bin assigned')
  async assign(@Param('id') id: string, @Body() body: AssignBinDto) {
    const bin = await this.binsService.assign(
      id,
      body.customerId,
      body.active ?? true,
    );
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }

  @Post(':id/unassign')
  @ApiOperation({
    summary: 'Unassign bin',
    description: 'Removes customer assignment and returns bin to available status.',
  })
  @ApiMongoIdParam('id', 'Bin MongoDB ID')
  @ApiOkDataResponse(BinDto, 'Bin unassigned')
  async unassign(@Param('id') id: string) {
    const bin = await this.binsService.unassign(id);
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }
}

@ApiTags('Customer - Bins')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/bins')
export class CustomerBinsController {
  constructor(private readonly binsService: BinsService) {}

  @Get('available')
  @ApiOperation({
    summary: 'List available bins',
    description: 'Returns bins that can be selected during subscription setup.',
  })
  @ApiOkDataResponse(BinDto, 'Available bin list', { isArray: true })
  async listAvailable() {
    return { data: await this.binsService.findAvailable() };
  }
}
