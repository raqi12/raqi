import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Driver, Role.Customer)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: await this.notificationsService.findByUser(user.sub) };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markRead(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return { data: notification };
  }
}
