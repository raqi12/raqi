import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { AuthUser } from '../../common/auth-user.interface';
import { Role } from '../../common/roles.enum';
import { UsersService } from '../users/users.service';
import { TicketMessagesService } from './ticket-messages.service';
import { SendTicketMessageSocketDto } from './dto/ticket.dto';
import { TicketsService } from './tickets.service';
import { toMessageDto, toTicketDto } from './tickets.presenter';

type TicketSocket = Socket & { user?: AuthUser };

@WebSocketGateway({
  namespace: '/tickets',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class TicketsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(TicketsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly ticketsService: TicketsService,
    private readonly ticketMessagesService: TicketMessagesService,
  ) {}

  async handleConnection(client: TicketSocket) {
    try {
      client.user = await this.authenticate(client);
    } catch {
      this.logger.warn(`Rejected socket connection ${client.id}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_ticket')
  async joinTicket(
    @ConnectedSocket() client: TicketSocket,
    @MessageBody() payload: { ticketId: string },
  ) {
    const user = this.requireUser(client);
    const ticket = await this.ticketsService.findByIdOrThrow(payload.ticketId);
    await this.ticketsService.assertAccess(ticket, user);
    await client.join(this.roomName(payload.ticketId));
    return { joined: true, ticketId: payload.ticketId };
  }

  @SubscribeMessage('leave_ticket')
  async leaveTicket(
    @ConnectedSocket() client: TicketSocket,
    @MessageBody() payload: { ticketId: string },
  ) {
    await client.leave(this.roomName(payload.ticketId));
    return { left: true, ticketId: payload.ticketId };
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: TicketSocket,
    @MessageBody() payload: SendTicketMessageSocketDto,
  ) {
    const user = this.requireUser(client);
    const ticket = await this.ticketsService.findByIdOrThrow(payload.ticketId);
    await this.ticketsService.assertAccess(ticket, user);

    const senderRole =
      user.role === Role.Admin
        ? 'admin'
        : user.role === Role.Driver
          ? 'driver'
          : 'customer';
    const { message, ticket: updatedTicket } =
      await this.ticketMessagesService.sendMessage({
        ticketId: payload.ticketId,
        senderId: user.sub,
        senderRole,
        body: payload.body,
      });

    const messageDto = toMessageDto(message);
    const ticketDto = toTicketDto(updatedTicket);

    this.server
      .to(this.roomName(payload.ticketId))
      .emit('message_created', messageDto);
    this.server
      .to(this.roomName(payload.ticketId))
      .emit('ticket_updated', ticketDto);

    return messageDto;
  }

  emitTicketUpdated(ticketId: string, ticketDto: ReturnType<typeof toTicketDto>) {
    this.server.to(this.roomName(ticketId)).emit('ticket_updated', ticketDto);
  }

  emitMessageCreated(
    ticketId: string,
    messageDto: ReturnType<typeof toMessageDto>,
  ) {
    this.server.to(this.roomName(ticketId)).emit('message_created', messageDto);
  }

  private async authenticate(client: TicketSocket): Promise<AuthUser> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      this.extractBearer(client.handshake.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const payload = this.jwtService.verify<AuthUser>(token, {
      secret: this.configService.get<string>('jwtSecret'),
    });
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid access token');
    }
    return payload;
  }

  private extractBearer(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }

  private requireUser(client: TicketSocket): AuthUser {
    if (!client.user) {
      throw new UnauthorizedException('Unauthorized socket');
    }
    return client.user;
  }

  private roomName(ticketId: string) {
    return `ticket:${ticketId}`;
  }
}
