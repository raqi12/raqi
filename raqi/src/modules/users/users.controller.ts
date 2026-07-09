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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from './dto/user.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list() {
    const users = await this.usersService.findStaff();
    return { data: users.map((user) => this.usersService.sanitize(user)) };
  }

  @Post()
  async create(@Body() body: CreateUserDto) {
    const existing = await this.usersService.findByEmail(body.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    const user = await this.usersService.create(body);
    return { data: this.usersService.sanitize(user) };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { data: this.usersService.sanitize(user) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const user = await this.usersService.update(id, body);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { data: this.usersService.sanitize(user) };
  }

  @Patch(':id/status')
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
