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
import { AreaDto } from '../../common/swagger/schemas/entity.schemas';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/area.dto';

@ApiTags('Admin - Areas')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiOperation({
    summary: 'List service areas',
    description: 'Returns all configured service areas and cities. Admin role required.',
  })
  @ApiOkDataResponse(AreaDto, 'Area list', { isArray: true })
  async list() {
    return { data: await this.areasService.findAll() };
  }

  @Post()
  @ApiOperation({
    summary: 'Create service area',
    description: 'Adds a new neighborhood or area within a city.',
  })
  @ApiBody({ type: CreateAreaDto })
  @ApiOkDataResponse(AreaDto, 'Area created', { status: 201 })
  async create(@Body() body: CreateAreaDto) {
    return { data: await this.areasService.create(body) };
  }
}
