import {
  Body,
  Controller,
  Delete,
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
  ApiOptionalQuery,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { AreaDto } from '../../common/swagger/schemas/entity.schemas';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto } from './dto/area.dto';

@ApiTags('Locations')
@Controller('areas')
export class PublicAreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiOperation({
    summary: 'List service areas',
    description:
      'Public catalog of areas for registration forms. Pass `cityId` to list areas within a selected city. No authentication required.',
  })
  @ApiOptionalQuery('cityId', 'Filter areas by parent city ID', {
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkDataResponse(AreaDto, 'Area list', { isArray: true })
  @ApiStandardErrorResponses()
  async list(@Query('cityId') cityId?: string) {
    return { data: await this.areasService.findAll(cityId) };
  }
}

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
    description: 'Returns all configured service areas, optionally filtered by city. Admin role required.',
  })
  @ApiQuery({
    name: 'cityId',
    required: false,
    description: 'Filter areas by parent city ID',
  })
  @ApiOkDataResponse(AreaDto, 'Area list', { isArray: true })
  async list(@Query('cityId') cityId?: string) {
    return { data: await this.areasService.findAll(cityId) };
  }

  @Post()
  @ApiOperation({
    summary: 'Create service area',
    description: 'Adds a new neighborhood or area within a city.',
  })
  @ApiBody({ type: CreateAreaDto })
  @ApiOkDataResponse(AreaDto, 'Area created', { status: 201 })
  @ApiStandardErrorResponses()
  async create(@Body() body: CreateAreaDto) {
    return { data: await this.areasService.create(body) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get area by ID' })
  @ApiMongoIdParam('id', 'Area MongoDB ID')
  @ApiOkDataResponse(AreaDto, 'Area details')
  async get(@Param('id') id: string) {
    const area = await this.areasService.findById(id);
    if (!area) {
      throw new NotFoundException('Area not found');
    }
    return { data: area };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update area' })
  @ApiMongoIdParam('id', 'Area MongoDB ID')
  @ApiBody({ type: UpdateAreaDto })
  @ApiOkDataResponse(AreaDto, 'Area updated')
  @ApiStandardErrorResponses()
  async update(@Param('id') id: string, @Body() body: UpdateAreaDto) {
    const area = await this.areasService.update(id, body);
    if (!area) {
      throw new NotFoundException('Area not found');
    }
    return { data: area };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete area',
    description: 'Deletes an area when it is not linked to routes.',
  })
  @ApiMongoIdParam('id', 'Area MongoDB ID')
  @ApiOkDataResponse(AreaDto, 'Area deleted')
  @ApiStandardErrorResponses()
  async remove(@Param('id') id: string) {
    const area = await this.areasService.delete(id);
    if (!area) {
      throw new NotFoundException('Area not found');
    }
    return { data: area };
  }
}
