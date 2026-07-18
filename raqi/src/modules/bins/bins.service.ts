import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bin, BinDocument } from './schemas/bin.schema';

@Injectable()
export class BinsService {
  constructor(
    @InjectModel(Bin.name) private readonly binModel: Model<BinDocument>,
  ) {}

  create(input: {
    code: string;
    qr: string;
    capacity?: number;
    fee?: number;
  }): Promise<BinDocument> {
    return this.binModel.create(input);
  }

  findAll(): Promise<BinDocument[]> {
    return this.binModel.find().exec();
  }

  findAvailable(): Promise<BinDocument[]> {
    return this.binModel.find({ status: 'available' }).exec();
  }

  findById(id: string): Promise<BinDocument | null> {
    return this.binModel.findById(id).exec();
  }

  findByCustomer(customerId: string): Promise<BinDocument[]> {
    return this.binModel.find({ customerId }).sort({ createdAt: -1 }).exec();
  }

  update(id: string, patch: Partial<Bin>): Promise<BinDocument | null> {
    return this.binModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  async assign(
    id: string,
    customerId: string,
    active = true,
    options?: { deliveryDate?: string | null },
  ): Promise<BinDocument | null> {
    const existingActiveBin = await this.binModel.exists({
      _id: { $ne: id },
      customerId,
      active: true,
    });
    if (existingActiveBin) {
      throw new BadRequestException(
        'This customer already has an active assigned bin. Unassign the old one first.',
      );
    }
    const update: Partial<Bin> = {
      customerId,
      active,
      status: active ? 'assigned' : 'available',
    };
    if (options && 'deliveryDate' in options) {
      update.deliveryDate = options.deliveryDate ?? null;
    }
    return this.binModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  unassign(id: string): Promise<BinDocument | null> {
    return this.binModel
      .findByIdAndUpdate(
        id,
        {
          customerId: null,
          active: false,
          status: 'available',
          deliveryDate: null,
        },
        { new: true },
      )
      .exec();
  }

  async getStats() {
    const [stats] = await this.binModel.aggregate<{
      totalBins: number;
      totalCapacity: number;
      availableBins: number;
    }>([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          totalCapacity: { $sum: { $ifNull: ['$capacity', 0] } },
          availableBins: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$status', 'available'] },
                    { $eq: ['$customerId', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0, totalBins: 1, totalCapacity: 1, availableBins: 1 } },
    ]);

    return stats ?? { totalBins: 0, totalCapacity: 0, availableBins: 0 };
  }
}
