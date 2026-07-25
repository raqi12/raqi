import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import {
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
} from '../../common/swagger/decorators';
import { UserDto } from '../../common/swagger/schemas/entity.schemas';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from './dto/user.dto';

@ApiTags('Admin - Users')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'By default returns staff accounts (admin/manager/supervisor). Pass scope=all to include customers and drivers (e.g. notification recipients).',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['staff', 'all'],
    description: 'staff (default) or all active app users',
  })
  @ApiOkDataResponse(UserDto, 'User list', { isArray: true })
  async list(@Query('scope') scope?: string) {
    const users =
      scope === 'all'
        ? await this.usersService.findAll()
        : await this.usersService.findStaff();
    return { data: users.map((user) => this.usersService.sanitize(user)) };
  }

  @Post()
  @ApiOperation({
    summary: 'Create staff user',
    description: 'Creates a new staff account with email, name, password, and role.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiOkDataResponse(UserDto, 'User created', { status: 201 })
  async create(@Body() body: CreateUserDto) {
    const existing = await this.usersService.findByEmail(body.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    const user = await this.usersService.create(body);
    return { data: this.usersService.sanitize(user) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff user by ID' })
  @ApiMongoIdParam('id', 'Staff user MongoDB ID')
  @ApiOkDataResponse(UserDto, 'Staff user details')
  async get(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { data: this.usersService.sanitize(user) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff user profile' })
  @ApiMongoIdParam()
  @ApiBody({ type: UpdateUserDto })
  @ApiOkDataResponse(UserDto, 'User updated')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const user = await this.usersService.update(id, body);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { data: this.usersService.sanitize(user) };
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update staff user status',
    description: 'Activate or deactivate a staff account.',
  })
  @ApiMongoIdParam()
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiOkDataResponse(UserDto, 'Status updated')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    const user = await this.usersService.updateStatus(id, body.status);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { data: this.usersService.sanitize(user) };
  }
}
