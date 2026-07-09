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
import { BinsService } from './bins.service';
import { AssignBinDto, CreateBinDto, UpdateBinDto } from './dto/bin.dto';

@ApiTags('Admin - Bins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/bins')
export class BinsController {
  constructor(private readonly binsService: BinsService) {}

  @Get()
  async list() {
    return { data: await this.binsService.findAll() };
  }

  @Get('stats')
  async stats() {
    return { data: await this.binsService.getStats() };
  }

  @Post()
  async create(@Body() body: CreateBinDto) {
    return { data: await this.binsService.create(body) };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const bin = await this.binsService.findById(id);
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateBinDto) {
    const bin = await this.binsService.update(id, body);
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }

  @Post(':id/assign')
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
  async unassign(@Param('id') id: string) {
    const bin = await this.binsService.unassign(id);
    if (!bin) {
      throw new NotFoundException('Bin not found');
    }
    return { data: bin };
  }
}

@ApiTags('Customer - Bins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/bins')
export class CustomerBinsController {
  constructor(private readonly binsService: BinsService) {}

  @Get('available')
  async listAvailable() {
    return { data: await this.binsService.findAvailable() };
  }
}
