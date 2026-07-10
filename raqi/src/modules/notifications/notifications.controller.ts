import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { NotificationDto } from '../../common/swagger/schemas/entity.schemas';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Driver, Role.Customer)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications',
    description: 'Returns in-app notifications for the authenticated user.',
  })
  @ApiOkDataResponse(NotificationDto, 'Notification list', { isArray: true })
  async list(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.notificationsService.findByUser(user.sub) };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Sets isRead to true for the specified notification.',
  })
  @ApiMongoIdParam('id', 'Notification MongoDB ID')
  @ApiOkDataResponse(NotificationDto, 'Notification marked as read')
  async markRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markRead(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return { data: notification };
  }
}
