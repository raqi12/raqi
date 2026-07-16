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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import {
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiOkEnvelopeResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { NotificationDto } from '../../common/swagger/schemas/entity.schemas';
import type { AuthUser } from '../../common/auth-user.interface';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { RolesGuard } from '../../common/roles.guard';
import {
  BulkIdsDto,
  ListNotificationsQueryDto,
  RegisterDeviceTokenDto,
  UpdatePreferencesDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Driver, Role.Customer)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private requireUser(user?: AuthUser): AuthUser {
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  @ApiOkEnvelopeResponse('Paginated notifications', { data: { items: [] } })
  async list(
    @Query() query: ListNotificationsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const auth = this.requireUser(user);
    return {
      data: await this.notificationsService.listForUser(auth.sub, query),
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  @ApiOkEnvelopeResponse('Unread count', { data: { count: 0 } })
  async unreadCount(@CurrentUser() user?: AuthUser) {
    const auth = this.requireUser(user);
    return {
      data: {
        count: await this.notificationsService.unreadCount(auth.sub),
      },
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiMongoIdParam('id')
  @ApiOkDataResponse(NotificationDto, 'Notification marked as read')
  async markRead(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    const auth = this.requireUser(user);
    return {
      data: await this.notificationsService.markRead(id, auth.sub),
    };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkEnvelopeResponse('Marked all read', { data: { modified: 0 } })
  async markAllRead(@CurrentUser() user?: AuthUser) {
    const auth = this.requireUser(user);
    return {
      data: {
        modified: await this.notificationsService.markAllRead(auth.sub),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiMongoIdParam('id')
  @ApiOkEnvelopeResponse('Deleted', { data: { deleted: true } })
  async remove(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    const auth = this.requireUser(user);
    await this.notificationsService.deleteForUser(id, auth.sub);
    return { data: { deleted: true } };
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete notifications' })
  @ApiBody({ type: BulkIdsDto })
  @ApiOkEnvelopeResponse('Bulk deleted', { data: { deleted: 0 } })
  async bulkDelete(@Body() body: BulkIdsDto, @CurrentUser() user?: AuthUser) {
    const auth = this.requireUser(user);
    return {
      data: {
        deleted: await this.notificationsService.bulkDeleteForUser(
          body.ids,
          auth.sub,
        ),
      },
    };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiOkEnvelopeResponse('Preferences', { data: {} })
  async getPreferences(@CurrentUser() user?: AuthUser) {
    const auth = this.requireUser(user);
    return {
      data: await this.notificationsService.getPreferences(auth.sub),
    };
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiOkEnvelopeResponse('Preferences updated', { data: {} })
  async updatePreferences(
    @Body() body: UpdatePreferencesDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const auth = this.requireUser(user);
    return {
      data: await this.notificationsService.updatePreferences(auth.sub, body),
    };
  }

  @Post('devices')
  @ApiOperation({ summary: 'Register FCM device token' })
  @ApiBody({ type: RegisterDeviceTokenDto })
  @ApiOkEnvelopeResponse('Device registered', { data: {} })
  async registerDevice(
    @Body() body: RegisterDeviceTokenDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const auth = this.requireUser(user);
    return {
      data: await this.notificationsService.registerDevice(
        auth.sub,
        body.token,
        body.deviceType,
      ),
    };
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Deactivate FCM device token' })
  @ApiOkEnvelopeResponse('Device removed', { data: { removed: true } })
  async removeDevice(
    @Param('token') token: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const auth = this.requireUser(user);
    await this.notificationsService.removeDevice(auth.sub, token);
    return { data: { removed: true } };
  }
}
