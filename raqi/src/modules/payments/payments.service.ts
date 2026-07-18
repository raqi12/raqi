import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletTransactionsService } from '../wallets/wallet-transactions.service';
import { Payment, PaymentDocument } from './schemas/payment.schema';

export type CustomerPaymentHistoryItem = {
  id: string;
  customerId: string;
  subscriptionId: string | null;
  amount: number;
  method: 'cash' | 'online' | 'wallet';
  status: 'pending' | 'pending_gateway' | 'paid' | 'failed';
  direction: 'credit' | 'debit';
  type: string;
  walletTransactionId: string | null;
  description: string | null;
  paidAt: string | null;
  createdAt: string | null;
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly customersService: CustomersService,
    private readonly walletsService: WalletsService,
    private readonly walletTransactionsService: WalletTransactionsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().sort({ createdAt: -1 }).exec();
  }

  findByCustomer(customerId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Customer finance history: pending Payment intents + full wallet ledger
   * (subscribe, deposits, admin credits, refunds, additional collections, etc.).
   */
  async findCustomerHistory(
    customerId: string,
  ): Promise<CustomerPaymentHistoryItem[]> {
    const [pendingPayments, walletPage] = await Promise.all([
      this.paymentModel
        .find({
          customerId,
          status: { $in: ['pending', 'pending_gateway'] },
        })
        .sort({ createdAt: -1 })
        .exec(),
      this.walletTransactionsService.findByCustomer(customerId, {
        page: 1,
        limit: 100,
      }),
    ]);

    const pendingItems: CustomerPaymentHistoryItem[] = pendingPayments.map(
      (payment) => {
        const createdAt = (
          payment as PaymentDocument & { createdAt?: Date }
        ).createdAt;
        return {
          id: String(payment.id),
          customerId: String(payment.customerId),
          subscriptionId: payment.subscriptionId
            ? String(payment.subscriptionId)
            : null,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          direction: 'credit' as const,
          type: 'payment',
          walletTransactionId: payment.walletTransactionId
            ? String(payment.walletTransactionId)
            : null,
          description: payment.description,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
          createdAt: createdAt ? createdAt.toISOString() : null,
        };
      },
    );

    const walletItems: CustomerPaymentHistoryItem[] = walletPage.items.map(
      (tx) => {
        const createdAt = (tx as typeof tx & { createdAt?: Date }).createdAt;
        const subscriptionId =
          tx.referenceType === 'subscription' && tx.referenceId
            ? String(tx.referenceId)
            : null;
        return {
          id: String(tx.id),
          customerId: String(tx.customerId),
          subscriptionId,
          amount: tx.amount,
          method: this.methodFromWalletType(tx.type),
          status: 'paid' as const,
          direction: tx.direction as 'credit' | 'debit',
          type: tx.type,
          walletTransactionId: String(tx.id),
          description: tx.description,
          paidAt: createdAt ? createdAt.toISOString() : null,
          createdAt: createdAt ? createdAt.toISOString() : null,
        };
      },
    );

    return [...pendingItems, ...walletItems].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });
  }

  private methodFromWalletType(type: string): 'cash' | 'online' | 'wallet' {
    if (type === 'payment' || type === 'deposit') return 'online';
    return 'wallet';
  }

  async findById(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async createManual(input: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    method: 'cash' | 'online';
    description?: string;
    recordedBy?: string;
  }): Promise<PaymentDocument> {
    if (input.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const customer = await this.customersService.findById(input.customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (input.subscriptionId) {
      const subscription = await this.subscriptionsService.findById(
        input.subscriptionId,
      );
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }
      if (String(subscription.customerId) !== input.customerId) {
        throw new BadRequestException(
          'Subscription does not belong to this customer',
        );
      }
    }

    const payment = await this.paymentModel.create({
      customerId: input.customerId,
      subscriptionId: input.subscriptionId ?? null,
      amount: input.amount,
      method: input.method,
      status: 'paid',
      recordedBy: input.recordedBy ?? null,
      description:
        input.description ??
        (input.method === 'cash' ? 'دفعة نقدية' : 'دفعة إلكترونية'),
      paidAt: new Date(),
      walletTransactionId: null,
    });

    await this.applyPaidSideEffects(payment, input.recordedBy);

    return (await this.paymentModel.findById(payment.id).exec())!;
  }

  createGatewayIntent(input: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    description?: string;
  }): Promise<PaymentDocument> {
    if (input.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.paymentModel.create({
      customerId: input.customerId,
      subscriptionId: input.subscriptionId ?? null,
      amount: input.amount,
      method: 'online',
      status: 'pending_gateway',
      description: input.description ?? 'دفعة عبر البوابة',
      walletTransactionId: null,
      recordedBy: null,
      paidAt: null,
    });
  }

  async confirmPaid(
    id: string,
    options?: { recordedBy?: string; description?: string },
  ): Promise<PaymentDocument> {
    const payment = await this.findById(id);

    if (payment.status === 'paid') {
      if (payment.walletTransactionId) {
        return payment;
      }
      await this.applyPaidSideEffects(payment, options?.recordedBy);
      return (await this.paymentModel.findById(id).exec())!;
    }

    if (payment.status === 'failed') {
      throw new BadRequestException('Cannot confirm a failed payment');
    }

    if (
      payment.status !== 'pending' &&
      payment.status !== 'pending_gateway'
    ) {
      throw new BadRequestException(
        `Cannot confirm payment with status "${payment.status}"`,
      );
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.recordedBy = options?.recordedBy ?? payment.recordedBy;
    if (options?.description) {
      payment.description = options.description;
    }
    await payment.save();

    await this.applyPaidSideEffects(payment, options?.recordedBy);
    return (await this.paymentModel.findById(id).exec())!;
  }

  async markFailed(id: string): Promise<PaymentDocument> {
    const payment = await this.findById(id);
    if (payment.status === 'paid') {
      throw new BadRequestException('Cannot fail a paid payment');
    }
    payment.status = 'failed';
    await payment.save();
    return payment;
  }

  private async applyPaidSideEffects(
    payment: PaymentDocument,
    recordedBy?: string | null,
  ): Promise<void> {
    if (payment.walletTransactionId) {
      return;
    }

    const methodLabel = payment.method === 'cash' ? 'نقداً' : 'إلكترونياً';
    const { transaction } = await this.walletsService.applyMovement({
      customerId: String(payment.customerId),
      type: 'payment',
      direction: 'credit',
      amount: payment.amount,
      referenceType: 'payment',
      referenceId: String(payment.id),
      description:
        payment.description ?? `دفعة مستلمة (${methodLabel})`,
      createdBy: recordedBy ?? payment.recordedBy ?? null,
    });

    payment.walletTransactionId = String(transaction.id);
    payment.status = 'paid';
    payment.paidAt = payment.paidAt ?? new Date();
    await payment.save();

    if (payment.subscriptionId) {
      await this.subscriptionsService.markPaymentPaid(
        String(payment.subscriptionId),
      );
    }

    const customer = await this.customersService.findById(
      String(payment.customerId),
    );
    if (customer?.userId) {
      void this.notificationsService
        .notifyFromTemplate(
          'PAYMENT_RECEIVED',
          [String(customer.userId)],
          { amount: String(payment.amount) },
          {
            referenceType: 'payment',
            referenceId: String(payment.id),
            actionUrl: `/payments/${payment.id}`,
          },
        )
        .catch(() => undefined);
    }
  }

  async sumRevenue(): Promise<number> {
    const result = await this.paymentModel
      .aggregate<{ total: number }>([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();
    return result[0]?.total ?? 0;
  }
}
