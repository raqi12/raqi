import { Injectable, NotFoundException } from '@nestjs/common';
import { BinsService } from '../bins/bins.service';
import { ComplaintsService } from '../complaints/complaints.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TasksService } from '../tasks/tasks.service';
import { DepositRequestsService } from '../wallets/deposit-requests.service';
import { WalletsService } from '../wallets/wallets.service';
import { CustomersService } from './customers.service';

@Injectable()
export class CustomerAdminService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly walletsService: WalletsService,
    private readonly depositRequestsService: DepositRequestsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
    private readonly binsService: BinsService,
    private readonly tasksService: TasksService,
    private readonly complaintsService: ComplaintsService,
  ) {}

  async getDetails(customerId: string) {
    const customer = await this.customersService.findByIdForAdmin(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const [
      wallet,
      addresses,
      subscriptions,
      payments,
      depositRequests,
      bins,
      tasks,
      complaints,
    ] = await Promise.all([
      this.walletsService.ensureWallet(customerId),
      this.customersService.listAddresses(customerId),
      this.subscriptionsService.findByCustomer(customerId),
      this.paymentsService.findByCustomer(customerId),
      this.depositRequestsService.findByCustomer(customerId),
      this.binsService.findByCustomer(customerId),
      this.tasksService.findByCustomer(customerId),
      this.complaintsService.findByCustomer(customerId),
    ]);

    return {
      customer,
      wallet,
      addresses,
      subscriptions,
      payments,
      depositRequests,
      bins,
      tasks,
      complaints,
    };
  }
}
