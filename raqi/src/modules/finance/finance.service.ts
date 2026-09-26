import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from '../plans/schemas/plan.schema';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from '../subscriptions/schemas/subscription.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from '../wallets/schemas/wallet-transaction.schema';
import type { WalletTransactionType } from '../wallets/wallet-transaction.types';
import type {
  FinanceMovementDto,
  FinanceMovementsDto,
  FinancePositionDto,
  FinanceStatementDto,
  FinanceStatementLineDto,
} from './dto/finance.dto';

type PeriodQuery = {
  from?: string;
  to?: string;
};

type MovementsQuery = PeriodQuery & {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
};

type WalletAgg = {
  walletFunds: number;
  walletCount: number;
};

type SubscriptionAgg = {
  activeSubscriptionFunds: number;
  activeSubscriptionCount: number;
  unpricedCount: number;
};

type StatementAgg = {
  _id: { type: string; direction: 'credit' | 'debit' };
  count: number;
  total: number;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly transactionModel: Model<WalletTransactionDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
  ) {}

  async position(): Promise<FinancePositionDto> {
    const [wallets, subscriptions] = await Promise.all([
      this.walletModel
        .aggregate<WalletAgg>([
          {
            $group: {
              _id: null,
              walletFunds: { $sum: '$balance' },
              walletCount: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.subscriptionModel
        .aggregate<SubscriptionAgg>([
          { $match: { status: SubscriptionStatus.Active } },
          {
            $addFields: {
              planObjectId: {
                $convert: {
                  input: '$planId',
                  to: 'objectId',
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $lookup: {
              from: this.planModel.collection.name,
              localField: 'planObjectId',
              foreignField: '_id',
              as: 'plan',
            },
          },
          { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              activeSubscriptionCount: { $sum: 1 },
              activeSubscriptionFunds: { $sum: { $ifNull: ['$plan.price', 0] } },
              unpricedCount: {
                $sum: {
                  $cond: [
                    { $eq: [{ $ifNull: ['$plan._id', null] }, null] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .exec(),
    ]);

    const wallet = wallets[0];
    const subscription = subscriptions[0];

    return {
      walletFunds: wallet?.walletFunds ?? 0,
      walletCount: wallet?.walletCount ?? 0,
      activeSubscriptionFunds: subscription?.activeSubscriptionFunds ?? 0,
      activeSubscriptionCount: subscription?.activeSubscriptionCount ?? 0,
      unpricedCount: subscription?.unpricedCount ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }

  async statement(query: PeriodQuery = {}): Promise<FinanceStatementDto> {
    const period = this.resolvePeriod(query.from, query.to);
    const rows = await this.transactionModel
      .aggregate<StatementAgg>([
        { $match: { createdAt: { $gte: period.from, $lte: period.to } } },
        {
          $group: {
            _id: { type: '$type', direction: '$direction' },
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    const byType: FinanceStatementLineDto[] = rows
      .map((row) => ({
        type: row._id.type,
        direction: row._id.direction,
        count: row.count,
        total: row.total,
      }))
      .sort((a, b) => {
        if (a.direction !== b.direction) {
          return a.direction === 'credit' ? -1 : 1;
        }
        return b.total - a.total;
      });

    const moneyIn = byType
      .filter((line) => line.direction === 'credit')
      .reduce((sum, line) => sum + line.total, 0);
    const moneyOut = byType
      .filter((line) => line.direction === 'debit')
      .reduce((sum, line) => sum + line.total, 0);

    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
      byType,
    };
  }

  async movements(query: MovementsQuery = {}): Promise<FinanceMovementsDto> {
    const period = this.resolvePeriod(query.from, query.to);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const filter: Record<string, unknown> = {
      createdAt: { $gte: period.from, $lte: period.to },
    };
    if (query.type) {
      filter.type = query.type;
    }

    const [docs, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    const items: FinanceMovementDto[] = docs.map((doc) => {
      const row = doc as typeof doc & { createdAt?: Date };
      return {
        id: String(row._id),
        customerId: row.customerId,
        type: row.type,
        direction: row.direction,
        amount: row.amount,
        balanceBefore: row.balanceBefore,
        balanceAfter: row.balanceAfter,
        referenceType: row.referenceType ?? null,
        referenceId: row.referenceId ?? null,
        description: row.description ?? null,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
      };
    });

    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private resolvePeriod(from?: string, to?: string): { from: Date; to: Date } {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    const start = from ? this.parseBound(from, 'start') : monthStart;
    const end = to ? this.parseBound(to, 'end') : monthEnd;
    if (start > end) {
      throw new BadRequestException('from must be before to');
    }
    return { from: start, to: end };
  }

  private parseBound(value: string, edge: 'start' | 'end'): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return edge === 'start'
        ? new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        : new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return date;
  }
}
