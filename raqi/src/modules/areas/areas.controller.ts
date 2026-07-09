import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/area.dto';

@ApiTags('Admin - Areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  async list() {
    return { data: await this.areasService.findAll() };
  }

  @Post()
  async create(@Body() body: CreateAreaDto) {
    return { data: await this.areasService.create(body) };
  }
}
