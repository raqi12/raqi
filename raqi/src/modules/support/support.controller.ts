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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import {
  FaqDto,
  SupportPageDto,
  SupportSettingsDto,
} from '../../common/swagger/schemas/entity.schemas';
import {
  CreateFaqDto,
  UpdateFaqDto,
  UpdateSupportSettingsDto,
} from './dto/support.dto';
import { FaqsService } from './faqs.service';
import { SupportSettingsService } from './support-settings.service';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
@ApiStandardErrorResponses()
export class PublicSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({
    summary: 'Get support page content',
    description:
      'Public support page data including contacts, working hours, FAQs, emergency info, and app metadata. No authentication required.',
  })
  @ApiOkDataResponse(SupportPageDto, 'Support page content')
  async getSupportPage() {
    return { data: await this.supportService.getPublicPayload() };
  }
}

@ApiTags('Customer - Support')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer')
@ApiStandardErrorResponses()
export class CustomerSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('support')
  @ApiOperation({
    summary: 'Get support page content',
    description:
      'Same support page payload as GET /support for authenticated customers.',
  })
  @ApiOkDataResponse(SupportPageDto, 'Support page content')
  async getSupportPage() {
    return { data: await this.supportService.getPublicPayload() };
  }
}

@ApiTags('Driver - Support')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Driver)
@Controller('driver')
@ApiStandardErrorResponses()
export class DriverSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('support')
  @ApiOperation({
    summary: 'Get support page content',
    description:
      'Same support page payload as GET /support for authenticated drivers.',
  })
  @ApiOkDataResponse(SupportPageDto, 'Support page content')
  async getSupportPage() {
    return { data: await this.supportService.getPublicPayload() };
  }
}

@ApiTags('Admin - Support')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/support')
export class AdminSupportController {
  constructor(
    private readonly supportSettingsService: SupportSettingsService,
    private readonly faqsService: FaqsService,
  ) {}

  @Get('settings')
  @ApiOperation({
    summary: 'Get support settings',
    description: 'Returns support page settings. May be null if not configured yet.',
  })
  @ApiOkDataResponse(SupportSettingsDto, 'Support settings (may be null)')
  async getSettings() {
    const settings = await this.supportSettingsService.getOrEmpty();
    return { data: settings };
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update support settings',
    description: 'Creates or updates the singleton support page settings.',
  })
  @ApiBody({ type: UpdateSupportSettingsDto })
  @ApiOkDataResponse(SupportSettingsDto, 'Support settings updated')
  async updateSettings(@Body() body: UpdateSupportSettingsDto) {
    return { data: await this.supportSettingsService.upsert(body) };
  }

  @Get('faqs')
  @ApiOperation({
    summary: 'List all FAQs',
    description: 'Returns all FAQ entries including inactive ones.',
  })
  @ApiOkDataResponse(FaqDto, 'FAQ list', { isArray: true })
  async listFaqs() {
    return { data: await this.faqsService.findAll() };
  }

  @Post('faqs')
  @ApiOperation({ summary: 'Create FAQ' })
  @ApiBody({ type: CreateFaqDto })
  @ApiOkDataResponse(FaqDto, 'FAQ created', { status: 201 })
  async createFaq(@Body() body: CreateFaqDto) {
    return { data: await this.faqsService.create(body) };
  }

  @Patch('faqs/:id')
  @ApiOperation({ summary: 'Update FAQ' })
  @ApiMongoIdParam('id', 'FAQ MongoDB ID')
  @ApiBody({ type: UpdateFaqDto })
  @ApiOkDataResponse(FaqDto, 'FAQ updated')
  async updateFaq(@Param('id') id: string, @Body() body: UpdateFaqDto) {
    const faq = await this.faqsService.update(id, body);
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return { data: faq };
  }

  @Delete('faqs/:id')
  @ApiOperation({ summary: 'Delete FAQ' })
  @ApiMongoIdParam('id', 'FAQ MongoDB ID')
  @ApiOkDataResponse(FaqDto, 'FAQ deleted')
  async deleteFaq(@Param('id') id: string) {
    const faq = await this.faqsService.remove(id);
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return { data: faq };
  }
}
