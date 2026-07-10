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
    summary: 'List staff users',
    description: 'Returns all non-customer staff accounts. Admin role required.',
  })
  @ApiOkDataResponse(UserDto, 'Staff user list', { isArray: true })
  async list() {
    const users = await this.usersService.findStaff();
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
