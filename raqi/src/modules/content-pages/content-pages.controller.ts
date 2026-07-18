import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import {
  ApiAdminAuth,
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { ContentPageDto } from '../../common/swagger/schemas/entity.schemas';
import { UpdateContentPageDto } from './dto/content-page.dto';
import { ContentPagesService } from './content-pages.service';

@ApiTags('Content Pages')
@Controller('pages')
@ApiStandardErrorResponses()
export class PublicContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy policy page content' })
  @ApiOkDataResponse(ContentPageDto, 'Privacy page content')
  async getPrivacy() {
    const page = await this.contentPagesService.getBySlug('privacy');
    return { data: this.contentPagesService.toPayload(page) };
  }

  @Get('instructions')
  @ApiOperation({ summary: 'Get app instructions page content' })
  @ApiOkDataResponse(ContentPageDto, 'Instructions page content')
  async getInstructions() {
    const page = await this.contentPagesService.getBySlug('instructions');
    return { data: this.contentPagesService.toPayload(page) };
  }
}

@ApiTags('Customer - Content Pages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/pages')
@ApiStandardErrorResponses()
export class CustomerContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy policy page content' })
  @ApiOkDataResponse(ContentPageDto, 'Privacy page content')
  async getPrivacy() {
    const page = await this.contentPagesService.getBySlug('privacy');
    return { data: this.contentPagesService.toPayload(page) };
  }

  @Get('instructions')
  @ApiOperation({ summary: 'Get app instructions page content' })
  @ApiOkDataResponse(ContentPageDto, 'Instructions page content')
  async getInstructions() {
    const page = await this.contentPagesService.getBySlug('instructions');
    return { data: this.contentPagesService.toPayload(page) };
  }
}

@ApiTags('Driver - Content Pages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Driver)
@Controller('driver/pages')
@ApiStandardErrorResponses()
export class DriverContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy policy page content' })
  @ApiOkDataResponse(ContentPageDto, 'Privacy page content')
  async getPrivacy() {
    const page = await this.contentPagesService.getBySlug('privacy');
    return { data: this.contentPagesService.toPayload(page) };
  }

  @Get('instructions')
  @ApiOperation({ summary: 'Get app instructions page content' })
  @ApiOkDataResponse(ContentPageDto, 'Instructions page content')
  async getInstructions() {
    const page = await this.contentPagesService.getBySlug('instructions');
    return { data: this.contentPagesService.toPayload(page) };
  }
}

@ApiTags('Admin - Content Pages')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/pages')
@ApiStandardErrorResponses()
export class AdminContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @Get(':slug')
  @ApiOperation({
    summary: 'Get content page by slug',
    description: 'slug must be privacy or instructions',
  })
  @ApiOkDataResponse(ContentPageDto, 'Content page')
  async get(@Param('slug') slug: string) {
    const parsed = this.contentPagesService.parseSlugOrThrow(slug);
    const page = await this.contentPagesService.getBySlug(parsed);
    return { data: this.contentPagesService.toPayload(page) };
  }

  @Patch(':slug')
  @ApiOperation({
    summary: 'Update content page by slug',
    description: 'slug must be privacy or instructions',
  })
  @ApiBody({ type: UpdateContentPageDto })
  @ApiOkDataResponse(ContentPageDto, 'Content page updated')
  async update(@Param('slug') slug: string, @Body() body: UpdateContentPageDto) {
    const parsed = this.contentPagesService.parseSlugOrThrow(slug);
    const page = await this.contentPagesService.upsert(parsed, body);
    return { data: this.contentPagesService.toPayload(page) };
  }
}
