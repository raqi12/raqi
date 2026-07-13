import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import {
  TicketMessage,
  TicketMessageSchema,
} from './schemas/ticket-message.schema';
import {
  TicketCounter,
  TicketCounterSchema,
} from './schemas/ticket-counter.schema';
import {
  AdminTicketsController,
  CustomerTicketsController,
} from './tickets.controller';
import { TicketMessagesService } from './ticket-messages.service';
import { TicketsGateway } from './tickets.gateway';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: TicketMessage.name, schema: TicketMessageSchema },
      { name: TicketCounter.name, schema: TicketCounterSchema },
    ]),
    UsersModule,
    JwtModule.register({}),
  ],
  controllers: [CustomerTicketsController, AdminTicketsController],
  providers: [TicketsService, TicketMessagesService, TicketsGateway],
  exports: [TicketsService, TicketMessagesService, TicketsGateway],
})
export class TicketsModule {}
