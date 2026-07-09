import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().exec();
  }

  findByCustomer(customerId: string): Promise<PaymentDocument[]> {
    return this.paymentModel.find({ customerId }).exec();
  }

  createManual(input: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    method: 'cash' | 'online';
  }): Promise<PaymentDocument> {
    return this.paymentModel.create({
      ...input,
      subscriptionId: input.subscriptionId ?? null,
      status: 'paid',
    });
  }

  createGatewayIntent(input: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
  }): Promise<PaymentDocument> {
    return this.paymentModel.create({
      ...input,
      subscriptionId: input.subscriptionId ?? null,
      method: 'online',
      status: 'pending_gateway',
    });
  }

  async sumRevenue(): Promise<number> {
    const result = await this.paymentModel
      .aggregate<{ total: number }>([
        { $match: { status: { $ne: 'failed' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();
    return result[0]?.total ?? 0;
  }
}
