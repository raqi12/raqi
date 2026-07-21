import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import {
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
} from '../../common/swagger/decorators';
import { DriverDto } from '../../common/swagger/schemas/entity.schemas';
import { UsersService } from '../users/users.service';
import { DriversService } from './drivers.service';
import {
  CreateDriverDto,
  UpdateDriverDto,
  UpdateDriverStatusDto,
} from './dto/driver.dto';

@ApiTags('Admin - Drivers')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/drivers')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List drivers',
    description: 'Returns all driver profiles with linked user accounts. Admin role required.',
  })
  @ApiOkDataResponse(DriverDto, 'Driver list', { isArray: true })
  async list() {
    return { data: await this.driversService.findAllForAdmin() };
  }

  @Post()
  @ApiOperation({
    summary: 'Create driver',
    description:
      'Creates a driver user account and linked driver profile with vehicle number.',
  })
  @ApiBody({ type: CreateDriverDto })
  @ApiOkDataResponse(DriverDto, 'Driver created', { status: 201 })
  async create(@Body() body: CreateDriverDto) {
    const email = body.email?.trim();
    if (email) {
      const existingEmail = await this.usersService.findByEmail(email);
      if (existingEmail && !existingEmail.deletedAt) {
        throw new BadRequestException('Email already exists');
      }
    }
    const existingPhone = await this.usersService.findByPhone(body.phone);
    if (existingPhone) {
      if (!existingPhone.deletedAt) {
        throw new BadRequestException('Phone already registered');
      }
      // Soft-deleted account still holding this phone — free it for re-registration
      await this.usersService.clearPhone(String(existingPhone.id));
    }
    const user = await this.usersService.create({
      email,
      phone: body.phone,
      name: body.name,
      password: body.password,
      role: Role.Driver,
      phoneVerified: true,
    });
    try {
      const driver = await this.driversService.create({
        userId: String(user.id),
        vehicleNumber: body.vehicleNumber,
        cityId: body.cityId,
        areaId: body.areaId,
      });
      return { data: driver };
    } catch (error) {
      await this.usersService.softDelete(String(user.id)).catch(() => undefined);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  @ApiMongoIdParam('id', 'Driver MongoDB ID')
  @ApiOkDataResponse(DriverDto, 'Driver details')
  async get(@Param('id') id: string) {
    const driver = await this.driversService.findById(id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return { data: driver };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update driver profile' })
  @ApiMongoIdParam('id', 'Driver MongoDB ID')
  @ApiBody({ type: UpdateDriverDto })
  @ApiOkDataResponse(DriverDto, 'Driver updated')
  async update(@Param('id') id: string, @Body() body: UpdateDriverDto) {
    const driver = await this.driversService.update(id, body);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return { data: driver };
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update driver status',
    description: 'Activate or deactivate a driver account.',
  })
  @ApiMongoIdParam('id', 'Driver MongoDB ID')
  @ApiBody({ type: UpdateDriverStatusDto })
  @ApiOkDataResponse(DriverDto, 'Driver status updated')
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

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete driver account',
    description:
      'Soft-deletes the linked user account and deactivates the driver profile. The driver can no longer sign in.',
  })
  @ApiMongoIdParam('id', 'Driver MongoDB ID')
  @ApiOkDataResponse(DriverDto, 'Driver deleted')
  async remove(@Param('id') id: string) {
    const driver = await this.driversService.findById(id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const user = await this.usersService.findById(driver.userId);
    if (user?.deletedAt) {
      throw new BadRequestException('Driver account is already deleted');
    }

    await this.usersService.softDelete(driver.userId);
    const updated = await this.driversService.update(id, { status: 'inactive' });
    return { data: updated ?? driver };
  }
}
