import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { AuthUser } from '../../common/auth-user.interface';
import { NotificationsService } from './notifications.service';

type NotificationSocket = Socket & { user?: AuthUser };

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayInit
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit() {
    this.notificationsService.setGatewayEmitter({
      emitToUser: (userId, event, payload) => {
        this.server.to(this.userRoom(userId)).emit(event, payload);
      },
    });
  }

  async handleConnection(client: NotificationSocket) {
    try {
      client.user = this.authenticate(client);
      await client.join(this.userRoom(client.user.sub));
    } catch {
      this.logger.warn(`Rejected notifications socket ${client.id}`);
      client.disconnect(true);
    }
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private authenticate(client: NotificationSocket): AuthUser {
    const authHeader =
      (client.handshake.auth?.token as string | undefined) ||
      (client.handshake.headers.authorization as string | undefined) ||
      '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    if (!token) {
      throw new Error('Missing token');
    }
    const secret =
      this.configService.get<string>('JWT_SECRET') || 'dev-secret-change-me';
    const payload = this.jwtService.verify<{
      sub: string;
      role: AuthUser['role'];
      email?: string;
    }>(token, { secret });
    return {
      sub: payload.sub,
      role: payload.role,
      email: payload.email ?? '',
    };
  }
}
