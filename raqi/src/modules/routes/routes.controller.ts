import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import {
  ApiAdminAuth,
  ApiOkDataResponse,
} from '../../common/swagger/decorators';
import { RouteDto } from '../../common/swagger/schemas/entity.schemas';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/route.dto';

@ApiTags('Admin - Routes')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({
    summary: 'List collection routes',
    description: 'Returns all waste collection routes with stops. Admin role required.',
  })
  @ApiOkDataResponse(RouteDto, 'Route list', { isArray: true })
  async list() {
    return { data: await this.routesService.findAll() };
  }

  @Post()
  @ApiOperation({
    summary: 'Create collection route',
    description: 'Defines a new route within a service area with optional stop list.',
  })
  @ApiBody({ type: CreateRouteDto })
  @ApiOkDataResponse(RouteDto, 'Route created', { status: 201 })
  async create(@Body() body: CreateRouteDto) {
    return { data: await this.routesService.create(body) };
  }
}
