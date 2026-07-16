import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiOptionalQuery,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import {
  TicketDto,
  TicketMessageDto,
  TicketMessageListDto,
} from '../../common/swagger/schemas/entity.schemas';
import { UsersService } from '../users/users.service';
import { TicketMessagesService } from './ticket-messages.service';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  ListTicketMessagesQueryDto,
  ListTicketsQueryDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { toMessageDto, toTicketDto } from './tickets.presenter';
import { TicketsGateway } from './tickets.gateway';
import { TicketsService } from './tickets.service';

@ApiTags('Customer - Tickets')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/tickets')
export class CustomerTicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly ticketMessagesService: TicketMessagesService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create support ticket',
    description: 'Creates a ticket and seeds the first message from the description.',
  })
  @ApiBody({ type: CreateTicketDto })
  @ApiOkDataResponse(TicketDto, 'Ticket created', { status: 201 })
  async create(@Body() body: CreateTicketDto, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ticket = await this.ticketsService.create({
      userId: user.sub,
      subject: body.subject,
      description: body.description,
      priority: body.priority,
    });

    await this.ticketMessagesService.createInitialMessage(
      String(ticket.id),
      user.sub,
      body.description,
    );

    return { data: toTicketDto(ticket) };
  }

  @Get()
  @ApiOperation({ summary: 'List my tickets' })
  @ApiOptionalQuery('status', 'Filter by status', {
    enum: ['pending', 'open', 'in_progress', 'resolved', 'closed'],
  })
  @ApiOkDataResponse(TicketDto, 'Ticket list', { isArray: true })
  async list(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tickets = await this.ticketsService.findAll({
      userId: user.sub,
      status: query.status,
    });
    return { data: tickets.map((ticket) => toTicketDto(ticket)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiOkDataResponse(TicketDto, 'Ticket details')
  async get(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ticket = await this.ticketsService.findByIdOrThrow(id);
    await this.ticketsService.assertAccess(ticket, user);
    return { data: toTicketDto(ticket) };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List ticket messages' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiOkDataResponse(TicketMessageListDto, 'Paginated ticket messages')
  async listMessages(
    @Param('id') id: string,
    @Query() query: ListTicketMessagesQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ticket = await this.ticketsService.findByIdOrThrow(id);
    await this.ticketsService.assertAccess(ticket, user);

    const result = await this.ticketMessagesService.list(
      id,
      query.page,
      query.limit,
    );
    return {
      data: {
        ...result,
        items: result.items.map((item) => toMessageDto(item)),
      },
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send ticket message' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiBody({ type: CreateTicketMessageDto })
  @ApiOkDataResponse(TicketMessageDto, 'Message sent', { status: 201 })
  async sendMessage(
    @Param('id') id: string,
    @Body() body: CreateTicketMessageDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ticket = await this.ticketsService.findByIdOrThrow(id);
    await this.ticketsService.assertAccess(ticket, user);

    const { message, ticket: updatedTicket } =
      await this.ticketMessagesService.sendMessage({
      ticketId: id,
      senderId: user.sub,
      senderRole: 'customer',
      body: body.body,
    });

    const messageDto = toMessageDto(message);
    const ticketDto = toTicketDto(updatedTicket);
    this.ticketsGateway.emitMessageCreated(id, messageDto);
    this.ticketsGateway.emitTicketUpdated(id, ticketDto);

    return { data: messageDto };
  }
}

@ApiTags('Driver - Tickets')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Driver)
@Controller('driver/tickets')
export class DriverTicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly ticketMessagesService: TicketMessagesService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create support ticket',
    description: 'Creates a ticket and seeds the first message from the description.',
  })
  @ApiBody({ type: CreateTicketDto })
  @ApiOkDataResponse(TicketDto, 'Ticket created', { status: 201 })
  async create(@Body() body: CreateTicketDto, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ticket = await this.ticketsService.create({
      userId: user.sub,
      subject: body.subject,
      description: body.description,
      priority: body.priority,
    });

    await this.ticketMessagesService.createInitialMessage(
      String(ticket.id),
      user.sub,
      body.description,
      'driver',
    );

    return { data: toTicketDto(ticket) };
  }

  @Get()
  @ApiOperation({ summary: 'List my tickets' })
  @ApiOptionalQuery('status', 'Filter by status', {
    enum: ['pending', 'open', 'in_progress', 'resolved', 'closed'],
  })
  @ApiOkDataResponse(TicketDto, 'Ticket list', { isArray: true })
  async list(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tickets = await this.ticketsService.findAll({
      userId: user.sub,
      status: query.status,
    });
    return { data: tickets.map((ticket) => toTicketDto(ticket)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiOkDataResponse(TicketDto, 'Ticket details')
  async get(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const ticket = await this.ticketsService.findByIdOrThrow(id);
    await this.ticketsService.assertAccess(ticket, user);
    return { data: toTicketDto(ticket) };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List ticket messages' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiOkDataResponse(TicketMessageListDto, 'Paginated ticket messages')
  async listMessages(
    @Param('id') id: string,
    @Query() query: ListTicketMessagesQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const ticket = await this.ticketsService.findByIdOrThrow(id);
    await this.ticketsService.assertAccess(ticket, user);

    const result = await this.ticketMessagesService.list(
      id,
      query.page,
      query.limit,
    );
    return {
      data: {
        items: result.items.map((item) => toMessageDto(item)),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send ticket message' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiBody({ type: CreateTicketMessageDto })
  @ApiOkDataResponse(TicketMessageDto, 'Message sent', { status: 201 })
  async sendMessage(
    @Param('id') id: string,
    @Body() body: CreateTicketMessageDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ticket = await this.ticketsService.findByIdOrThrow(id);
    await this.ticketsService.assertAccess(ticket, user);

    const { message, ticket: updatedTicket } =
      await this.ticketMessagesService.sendMessage({
        ticketId: id,
        senderId: user.sub,
        senderRole: 'driver',
        body: body.body,
      });

    const messageDto = toMessageDto(message);
    const ticketDto = toTicketDto(updatedTicket);
    this.ticketsGateway.emitMessageCreated(id, messageDto);
    this.ticketsGateway.emitTicketUpdated(id, ticketDto);

    return { data: messageDto };
  }
}

@ApiTags('Admin - Tickets')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/tickets')
export class AdminTicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly ticketMessagesService: TicketMessagesService,
    private readonly usersService: UsersService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  private async enrichTicket(ticket: Parameters<typeof toTicketDto>[0]) {
    const user = await this.usersService.findById(ticket.userId);
    return toTicketDto(ticket, user?.name);
  }

  @Get()
  @ApiOperation({ summary: 'List all tickets' })
  @ApiOptionalQuery('status', 'Filter by status', {
    enum: ['pending', 'open', 'in_progress', 'resolved', 'closed'],
  })
  @ApiOptionalQuery('priority', 'Filter by priority', {
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @ApiOptionalQuery('assigneeId', 'Filter by assignee user id')
  @ApiOptionalQuery('search', 'Search subject or ticket number')
  @ApiOkDataResponse(TicketDto, 'Ticket list', { isArray: true })
  async list(@Query() query: ListTicketsQueryDto) {
    const tickets = await this.ticketsService.findAll(query);
    const enriched = await Promise.all(tickets.map((ticket) => this.enrichTicket(ticket)));
    return { data: enriched };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiOkDataResponse(TicketDto, 'Ticket details')
  async get(@Param('id') id: string) {
    const ticket = await this.ticketsService.findByIdOrThrow(id);
    return { data: await this.enrichTicket(ticket) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkDataResponse(TicketDto, 'Ticket updated')
  async update(@Param('id') id: string, @Body() body: UpdateTicketDto) {
    const ticket = await this.ticketsService.update(id, body);
    const dto = await this.enrichTicket(ticket);
    this.ticketsGateway.emitTicketUpdated(id, dto);
    return { data: dto };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List ticket messages' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiOkDataResponse(TicketMessageListDto, 'Paginated ticket messages')
  async listMessages(
    @Param('id') id: string,
    @Query() query: ListTicketMessagesQueryDto,
  ) {
    await this.ticketsService.findByIdOrThrow(id);
    const result = await this.ticketMessagesService.list(
      id,
      query.page,
      query.limit,
    );
    return {
      data: {
        ...result,
        items: result.items.map((item) => toMessageDto(item)),
      },
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send admin reply' })
  @ApiMongoIdParam('id', 'Ticket MongoDB ID')
  @ApiBody({ type: CreateTicketMessageDto })
  @ApiOkDataResponse(TicketMessageDto, 'Message sent', { status: 201 })
  async sendMessage(
    @Param('id') id: string,
    @Body() body: CreateTicketMessageDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.ticketsService.findByIdOrThrow(id);
    const { message, ticket: updatedTicket } =
      await this.ticketMessagesService.sendMessage({
      ticketId: id,
      senderId: user.sub,
      senderRole: 'admin',
      body: body.body,
    });

    const messageDto = toMessageDto(message);
    const ticketDto = await this.enrichTicket(updatedTicket);
    this.ticketsGateway.emitMessageCreated(id, messageDto);
    this.ticketsGateway.emitTicketUpdated(id, ticketDto);

    return { data: messageDto };
  }
}
