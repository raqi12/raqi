import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiOkEnvelopeResponse,
} from '../../common/swagger/decorators';
import { NotificationDto } from '../../common/swagger/schemas/entity.schemas';
import {
  AnalyticsQueryDto,
  BulkIdsDto,
  CreateTemplateDto,
  ListNotificationsQueryDto,
  ScheduleNotificationDto,
  SendNotificationDto,
  UpdateScheduledNotificationDto,
  UpdateTemplateDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Admin - Notifications')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.Admin)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private requireUser(user?: AuthUser): AuthUser {
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  @Get()
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Admin list notifications' })
  @ApiOkEnvelopeResponse('Paginated notifications', { data: { items: [] } })
  async list(@Query() query: ListNotificationsQueryDto) {
    return { data: await this.notificationsService.adminList(query) };
  }

  @Get('analytics')
  @RequirePermissions('notifications.analytics')
  @ApiOperation({ summary: 'Notification analytics' })
  @ApiOkEnvelopeResponse('Analytics', { data: {} })
  async analytics(@Query() query: AnalyticsQueryDto) {
    return { data: await this.notificationsService.analytics(query) };
  }

  @Get('templates')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'List notification templates' })
  @ApiOkEnvelopeResponse('Templates', { data: [] })
  async listTemplates() {
    return { data: await this.notificationsService.listTemplates() };
  }

  @Post('templates')
  @RequirePermissions('notifications.create')
  @ApiOperation({ summary: 'Create template' })
  @ApiBody({ type: CreateTemplateDto })
  @ApiOkEnvelopeResponse('Template created', { data: {} })
  async createTemplate(@Body() body: CreateTemplateDto) {
    return { data: await this.notificationsService.createTemplate(body) };
  }

  @Patch('templates/:id')
  @RequirePermissions('notifications.update')
  @ApiOperation({ summary: 'Update template' })
  @ApiMongoIdParam('id')
  @ApiBody({ type: UpdateTemplateDto })
  @ApiOkEnvelopeResponse('Template updated', { data: {} })
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: UpdateTemplateDto,
  ) {
    return { data: await this.notificationsService.updateTemplate(id, body) };
  }

  @Delete('templates/:id')
  @RequirePermissions('notifications.delete')
  @ApiOperation({ summary: 'Delete template' })
  @ApiMongoIdParam('id')
  @ApiOkEnvelopeResponse('Template deleted', { data: {} })
  async deleteTemplate(@Param('id') id: string) {
    return { data: await this.notificationsService.deleteTemplate(id) };
  }

  @Get('scheduled')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'List scheduled notifications' })
  @ApiOkEnvelopeResponse('Scheduled list', { data: [] })
  async listScheduled() {
    return { data: await this.notificationsService.listScheduled() };
  }

  @Post('schedule')
  @RequirePermissions('notifications.send')
  @ApiOperation({ summary: 'Schedule a notification' })
  @ApiBody({ type: ScheduleNotificationDto })
  @ApiOkEnvelopeResponse('Scheduled', { data: {} })
  async schedule(
    @Body() body: ScheduleNotificationDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const auth = this.requireUser(user);
    return {
      data: await this.notificationsService.createScheduled(body, auth.sub),
    };
  }

  @Patch('scheduled/:id')
  @RequirePermissions('notifications.update')
  @ApiOperation({ summary: 'Update scheduled notification' })
  @ApiMongoIdParam('id')
  @ApiBody({ type: UpdateScheduledNotificationDto })
  @ApiOkEnvelopeResponse('Updated', { data: {} })
  async updateScheduled(
    @Param('id') id: string,
    @Body() body: UpdateScheduledNotificationDto,
  ) {
    return { data: await this.notificationsService.updateScheduled(id, body) };
  }

  @Post('scheduled/:id/cancel')
  @RequirePermissions('notifications.update')
  @ApiOperation({ summary: 'Cancel scheduled notification' })
  @ApiMongoIdParam('id')
  @ApiOkEnvelopeResponse('Cancelled', { data: {} })
  async cancelScheduled(@Param('id') id: string) {
    return { data: await this.notificationsService.cancelScheduled(id) };
  }

  @Post('send')
  @RequirePermissions('notifications.send')
  @ApiOperation({ summary: 'Send notification now' })
  @ApiBody({ type: SendNotificationDto })
  @ApiOkEnvelopeResponse('Sent', {
    data: {
      count: 0,
      push: {
        firebaseEnabled: false,
        attempted: 0,
        delivered: 0,
        failed: 0,
        skippedNoDevices: 0,
        skippedPrefs: 0,
        skippedFirebaseDisabled: 0,
      },
    },
  })
  async send(@Body() body: SendNotificationDto) {
    const result = await this.notificationsService.send(body);
    return { data: { count: result.count, push: result.push } };
  }

  @Post('bulk-delete')
  @RequirePermissions('notifications.delete')
  @ApiOperation({ summary: 'Bulk delete notifications' })
  @ApiBody({ type: BulkIdsDto })
  @ApiOkEnvelopeResponse('Bulk deleted', { data: { deleted: 0 } })
  async bulkDelete(@Body() body: BulkIdsDto) {
    return {
      data: {
        deleted: await this.notificationsService.adminBulkDelete(body.ids),
      },
    };
  }

  @Get(':id')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Get notification details + logs' })
  @ApiMongoIdParam('id')
  @ApiOkEnvelopeResponse('Notification details', { data: {} })
  async get(@Param('id') id: string) {
    return { data: await this.notificationsService.adminGet(id) };
  }

  @Delete(':id')
  @RequirePermissions('notifications.delete')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiMongoIdParam('id')
  @ApiOkDataResponse(NotificationDto, 'Deleted')
  async remove(@Param('id') id: string) {
    return { data: await this.notificationsService.adminDelete(id) };
  }
}
