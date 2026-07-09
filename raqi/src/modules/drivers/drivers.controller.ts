import {
  BadRequestException,
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
import { UsersService } from '../users/users.service';
import { DriversService } from './drivers.service';
import {
  CreateDriverDto,
  UpdateDriverDto,
  UpdateDriverStatusDto,
} from './dto/driver.dto';

@ApiTags('Admin - Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/drivers')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async list() {
    return { data: await this.driversService.findAll() };
  }

  @Post()
  async create(@Body() body: CreateDriverDto) {
    const existing = await this.usersService.findByEmail(body.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    const user = await this.usersService.create({
      email: body.email,
      name: body.name,
      password: body.password,
      role: Role.Driver,
    });
    const driver = await this.driversService.create({
      userId: String(user.id),
      vehicleNumber: body.vehicleNumber,
    });
    return { data: driver };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const driver = await this.driversService.findById(id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return { data: driver };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateDriverDto) {
    const driver = await this.driversService.update(id, body);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return { data: driver };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDriverStatusDto,
  ) {
    const driver = await this.driversService.update(id, { status: body.status });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return { data: driver };
  }
}
