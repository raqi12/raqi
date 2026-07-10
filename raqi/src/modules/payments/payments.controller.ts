import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiAdminAuth,
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { PaymentDto } from '../../common/swagger/schemas/entity.schemas';
import { CustomersService } from '../customers/customers.service';
import { PaymentsService } from './payments.service';
import { CreateCustomerPaymentDto, CreatePaymentDto } from './dto/payment.dto';

@ApiTags('Admin - Payments')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all payments',
    description: 'Returns payment records across all customers.',
  })
  @ApiOkDataResponse(PaymentDto, 'Payment list', { isArray: true })
  async list() {
    return { data: await this.paymentsService.findAll() };
  }

  @Post()
  @ApiOperation({
    summary: 'Record manual payment',
    description: 'Creates a payment record for cash or online settlement by admin.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiOkDataResponse(PaymentDto, 'Payment recorded', { status: 201 })
  async create(@Body() body: CreatePaymentDto) {
    return { data: await this.paymentsService.createManual(body) };
  }
}

@ApiTags('Customer - Payments')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
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
  @ApiOperation({
    summary: 'Initiate online payment',
    description:
      'Creates a pending gateway payment intent for the authenticated customer.',
  })
  @ApiBody({ type: CreateCustomerPaymentDto })
  @ApiOkDataResponse(PaymentDto, 'Payment intent created', { status: 201 })
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
  @ApiOperation({
    summary: 'List customer payments',
    description: 'Returns payment history for the authenticated customer.',
  })
  @ApiOkDataResponse(PaymentDto, 'Customer payment list', { isArray: true })
  async list(@CurrentUser() user?: AuthUser) {
    const customerId = await this.resolveCustomerId(user);
    return { data: await this.paymentsService.findByCustomer(customerId) };
  }
}
