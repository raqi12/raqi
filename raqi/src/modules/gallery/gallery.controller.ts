import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  GalleryImageUrlDto,
  GalleryItemDto,
} from '../../common/swagger/schemas/entity.schemas';
import {
  GalleryCreateWithImageDto,
  GalleryImageUploadDto,
} from '../../common/swagger/schemas/upload.schemas';
import {
  CreateGalleryDto,
  CreateGalleryMultipartDto,
  UpdateGalleryDto,
} from './dto/gallery.dto';
import { GalleryService } from './gallery.service';
import {
  buildGalleryImageUrl,
  galleryImageFilter,
  galleryImageStorage,
} from './upload.config';

@ApiTags('Customer - Gallery')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer')
@ApiStandardErrorResponses()
export class CustomerGalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('gallery')
  @ApiOperation({
    summary: 'List gallery items',
    description: 'Returns active gallery items sorted by sortOrder for customers.',
  })
  @ApiOkDataResponse(GalleryItemDto, 'Gallery list', { isArray: true })
  async list() {
    return { data: await this.galleryService.findActive() };
  }
}

@ApiTags('Driver - Gallery')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Driver)
@Controller('driver')
@ApiStandardErrorResponses()
export class DriverGalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('gallery')
  @ApiOperation({
    summary: 'List gallery items',
    description: 'Returns active gallery items sorted by sortOrder for drivers.',
  })
  @ApiOkDataResponse(GalleryItemDto, 'Gallery list', { isArray: true })
  async list() {
    return { data: await this.galleryService.findActive() };
  }
}

@ApiTags('Admin - Gallery')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/gallery')
@ApiStandardErrorResponses()
export class AdminGalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  @ApiOperation({
    summary: 'List gallery items',
    description: 'Returns all gallery items including inactive ones.',
  })
  @ApiOkDataResponse(GalleryItemDto, 'Gallery list', { isArray: true })
  async list() {
    return { data: await this.galleryService.findAll() };
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload gallery image',
    description: 'Uploads an image and returns its public URL for use in create/update.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: GalleryImageUploadDto })
  @ApiOkDataResponse(GalleryImageUrlDto, 'Uploaded image URL', { status: 201 })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: galleryImageStorage,
      fileFilter: galleryImageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return { data: { imageUrl: buildGalleryImageUrl(file.filename) } };
  }

  @Post()
  @ApiOperation({
    summary: 'Create gallery item',
    description:
      'Creates a gallery item. Provide `imageUrl` from a previous upload, or use multipart create.',
  })
  @ApiBody({ type: CreateGalleryDto })
  @ApiOkDataResponse(GalleryItemDto, 'Gallery item created', { status: 201 })
  async create(@Body() body: CreateGalleryDto) {
    return { data: await this.galleryService.create(body) };
  }

  @Post('with-image')
  @ApiOperation({
    summary: 'Create gallery item with image upload',
    description: 'Creates a gallery item and uploads the image in one request.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: GalleryCreateWithImageDto })
  @ApiOkDataResponse(GalleryItemDto, 'Gallery item created', { status: 201 })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: galleryImageStorage,
      fileFilter: galleryImageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createWithImage(
    @Body() body: CreateGalleryMultipartDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      data: await this.galleryService.create({
        title: body.title,
        imageUrl: buildGalleryImageUrl(file.filename),
        caption: body.caption,
        linkUrl: body.linkUrl,
        sortOrder: body.sortOrder,
        active: body.active,
      }),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gallery item by ID' })
  @ApiMongoIdParam('id', 'Gallery item MongoDB ID')
  @ApiOkDataResponse(GalleryItemDto, 'Gallery item details')
  async get(@Param('id') id: string) {
    const item = await this.galleryService.findById(id);
    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }
    return { data: item };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update gallery item' })
  @ApiMongoIdParam('id', 'Gallery item MongoDB ID')
  @ApiBody({ type: UpdateGalleryDto })
  @ApiOkDataResponse(GalleryItemDto, 'Gallery item updated')
  async update(@Param('id') id: string, @Body() body: UpdateGalleryDto) {
    const item = await this.galleryService.update(id, body);
    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }
    return { data: item };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete gallery item' })
  @ApiMongoIdParam('id', 'Gallery item MongoDB ID')
  @ApiOkDataResponse(GalleryItemDto, 'Gallery item deleted')
  async remove(@Param('id') id: string) {
    const item = await this.galleryService.remove(id);
    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }
    return { data: item };
  }
}
