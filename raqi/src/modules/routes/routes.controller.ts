import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/route.dto';

@ApiTags('Admin - Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  async list() {
    return { data: await this.routesService.findAll() };
  }

  @Post()
  async create(@Body() body: CreateRouteDto) {
    return { data: await this.routesService.create(body) };
  }
}
