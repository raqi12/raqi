import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
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
import { CustomersService } from '../customers/customers.service';
import { PaymentsService } from './payments.service';
import { CreateCustomerPaymentDto, CreatePaymentDto } from './dto/payment.dto';

@ApiTags('Admin - Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async list() {
    return { data: await this.paymentsService.findAll() };
  }

  @Post()
  async create(@Body() body: CreatePaymentDto) {
    return { data: await this.paymentsService.createManual(body) };
  }
}

@ApiTags('Customer - Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/payments')
export class CustomerPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly customersService: CustomersService,
  ) {}

  private async resolveCustomerId(user?: AuthUser): Promise<string> {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const customer = await this.customersService.findByUserId(user.sub);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return String(customer.id);
  }

  @Post()
  async initiate(
    @Body() body: CreateCustomerPaymentDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const customerId = await this.resolveCustomerId(user);
    return {
      data: await this.paymentsService.createGatewayIntent({
        customerId,
        subscriptionId: body.subscriptionId,
        amount: body.amount,
      }),
    };
  }

  @Get()
  async list(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.paymentsService.findByCustomer(customerId) };
  }
}
