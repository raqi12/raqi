import {
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
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { CityDto } from '../../common/swagger/schemas/entity.schemas';
import { CitiesService } from './cities.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';

@ApiTags('Locations')
@Controller('cities')
export class PublicCitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'List cities',
    description:
      'Public catalog of cities for registration and signup forms. Pair with `GET /areas?cityId=` to populate location dropdowns. No authentication required.',
  })
  @ApiOkDataResponse(CityDto, 'City list', { isArray: true })
  @ApiStandardErrorResponses()
  async list() {
    return { data: await this.citiesService.findAll() };
  }
}

@ApiTags('Admin - Cities')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'List cities',
    description: 'Returns all configured cities. Admin role required.',
  })
  @ApiOkDataResponse(CityDto, 'City list', { isArray: true })
  async list() {
    return { data: await this.citiesService.findAll() };
  }

  @Post()
  @ApiOperation({
    summary: 'Create city',
    description: 'Adds a new city to the service catalog.',
  })
  @ApiBody({ type: CreateCityDto })
  @ApiOkDataResponse(CityDto, 'City created', { status: 201 })
  @ApiStandardErrorResponses()
  async create(@Body() body: CreateCityDto) {
    await this.citiesService.ensureUniqueName(body.name);
    return { data: await this.citiesService.create(body) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiMongoIdParam('id', 'City MongoDB ID')
  @ApiOkDataResponse(CityDto, 'City details')
  async get(@Param('id') id: string) {
    const city = await this.citiesService.findById(id);
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return { data: city };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update city' })
  @ApiMongoIdParam('id', 'City MongoDB ID')
  @ApiBody({ type: UpdateCityDto })
  @ApiOkDataResponse(CityDto, 'City updated')
  @ApiStandardErrorResponses()
  async update(@Param('id') id: string, @Body() body: UpdateCityDto) {
    if (body.name) {
      await this.citiesService.ensureUniqueName(body.name, id);
    }
    const city = await this.citiesService.update(id, body);
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return { data: city };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete city',
    description: 'Deletes a city when it has no linked areas.',
  })
  @ApiMongoIdParam('id', 'City MongoDB ID')
  @ApiOkDataResponse(CityDto, 'City deleted')
  @ApiStandardErrorResponses()
  async remove(@Param('id') id: string) {
    const city = await this.citiesService.delete(id);
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return { data: city };
  }
}
