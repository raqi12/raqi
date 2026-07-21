import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bin, BinDocument } from './schemas/bin.schema';
import {
  BinAssignment,
  BinAssignmentDocument,
} from './schemas/bin-assignment.schema';

export type BinWithAssignment = BinDocument & {
  assignmentId?: string;
  deliveryDate?: string | null;
  customerId?: string | null;
};

@Injectable()
export class BinsService {
  constructor(
    @InjectModel(Bin.name) private readonly binModel: Model<BinDocument>,
    @InjectModel(BinAssignment.name)
    private readonly assignmentModel: Model<BinAssignmentDocument>,
  ) {}

  create(input: {
    code: string;
    capacity?: number;
    fee?: number;
    totalCount: number;
  }): Promise<BinDocument> {
    const totalCount = input.totalCount ?? 0;
    return this.binModel.create({
      code: input.code,
      capacity: input.capacity ?? 0,
      fee: input.fee ?? 0,
      totalCount,
      availableCount: totalCount,
      active: true,
    });
  }

  findAll(): Promise<BinDocument[]> {
    return this.binModel.find().sort({ code: 1 }).exec();
  }

  findAvailable(): Promise<BinDocument[]> {
    return this.binModel
      .find({ availableCount: { $gt: 0 }, active: true })
      .sort({ code: 1 })
      .exec();
  }

  findById(id: string): Promise<BinDocument | null> {
    return this.binModel.findById(id).exec();
  }

  async update(
    id: string,
    patch: {
      capacity?: number;
      fee?: number;
      totalCount?: number;
      active?: boolean;
    },
  ): Promise<BinDocument | null> {
    const bin = await this.binModel.findById(id).exec();
    if (!bin) {
      return null;
    }

    if (patch.capacity !== undefined) {
      bin.capacity = patch.capacity;
    }
    if (patch.fee !== undefined) {
      bin.fee = patch.fee;
    }
    if (patch.active !== undefined) {
      bin.active = patch.active;
    }
    if (patch.totalCount !== undefined) {
      const assigned = bin.totalCount - bin.availableCount;
      if (patch.totalCount < assigned) {
        throw new BadRequestException(
          `Cannot set totalCount below assigned stock (${assigned})`,
        );
      }
      const delta = patch.totalCount - bin.totalCount;
      bin.totalCount = patch.totalCount;
      bin.availableCount = Math.max(0, bin.availableCount + delta);
    }

    return bin.save();
  }

  /**
   * Atomically decrement stock and create an assignment.
   * Enforces one active assignment per customer.
   */
  async take(
    binId: string,
    customerId: string,
    options?: {
      subscriptionId?: string | null;
      deliveryDate?: string | null;
    },
  ): Promise<{ bin: BinDocument; assignment: BinAssignmentDocument }> {
    const existingActive = await this.assignmentModel
      .findOne({ customerId, active: true })
      .exec();
    if (existingActive) {
      if (String(existingActive.binId) === binId) {
        return {
          bin: (await this.binModel.findById(binId).exec())!,
          assignment: existingActive,
        };
      }
      throw new BadRequestException(
        'This customer already has an active assigned bin. Release the old one first.',
      );
    }

    const bin = await this.binModel
      .findOneAndUpdate(
        {
          _id: binId,
          active: true,
          availableCount: { $gte: 1 },
        },
        { $inc: { availableCount: -1 } },
        { new: true },
      )
      .exec();

    if (!bin) {
      const exists = await this.binModel.exists({ _id: binId });
      if (!exists) {
        throw new NotFoundException('Bin not found');
      }
      throw new BadRequestException('Bin is not available');
    }

    try {
      const assignment = await this.assignmentModel.create({
        binId,
        customerId,
        subscriptionId: options?.subscriptionId ?? null,
        deliveryDate: options?.deliveryDate ?? null,
        active: true,
      });
      return { bin, assignment };
    } catch (error) {
      await this.binModel
        .findByIdAndUpdate(binId, { $inc: { availableCount: 1 } })
        .exec()
        .catch(() => undefined);
      throw error;
    }
  }

  /**
   * Release an assignment and restore one unit of stock (capped at totalCount).
   */
  async release(assignmentId: string): Promise<{
    bin: BinDocument | null;
    assignment: BinAssignmentDocument;
  }> {
    const assignment = await this.assignmentModel.findById(assignmentId).exec();
    if (!assignment) {
      throw new NotFoundException('Bin assignment not found');
    }
    if (!assignment.active) {
      const bin = await this.binModel.findById(assignment.binId).exec();
      return { bin, assignment };
    }

    assignment.active = false;
    await assignment.save();

    const bin = await this.binModel
      .findOneAndUpdate(
        { _id: assignment.binId },
        [
          {
            $set: {
              availableCount: {
                $min: [
                  '$totalCount',
                  { $add: ['$availableCount', 1] },
                ],
              },
            },
          },
        ],
        { new: true },
      )
      .exec();

    return { bin, assignment };
  }

  async releaseBySubscription(
    subscriptionId: string,
  ): Promise<BinAssignmentDocument | null> {
    const assignment = await this.assignmentModel
      .findOne({ subscriptionId, active: true })
      .exec();
    if (!assignment) {
      return null;
    }
    await this.release(String(assignment.id));
    return assignment;
  }

  async releaseActiveForCustomer(
    customerId: string,
  ): Promise<BinAssignmentDocument | null> {
    const assignment = await this.assignmentModel
      .findOne({ customerId, active: true })
      .exec();
    if (!assignment) {
      return null;
    }
    await this.release(String(assignment.id));
    return assignment;
  }

  findAssignments(binId: string): Promise<BinAssignmentDocument[]> {
    return this.assignmentModel
      .find({ binId })
      .sort({ createdAt: -1 })
      .exec();
  }

  findAssignmentById(id: string): Promise<BinAssignmentDocument | null> {
    return this.assignmentModel.findById(id).exec();
  }

  findActiveAssignmentByCustomer(
    customerId: string,
  ): Promise<BinAssignmentDocument | null> {
    return this.assignmentModel.findOne({ customerId, active: true }).exec();
  }

  findActiveAssignmentBySubscription(
    subscriptionId: string,
  ): Promise<BinAssignmentDocument | null> {
    return this.assignmentModel
      .findOne({ subscriptionId, active: true })
      .exec();
  }

  async setAssignmentSubscription(
    assignmentId: string,
    subscriptionId: string,
  ): Promise<BinAssignmentDocument | null> {
    return this.assignmentModel
      .findByIdAndUpdate(
        assignmentId,
        { subscriptionId },
        { new: true },
      )
      .exec();
  }

  async updateActiveAssignmentDeliveryDate(
    customerId: string,
    deliveryDate: string | null,
  ): Promise<BinAssignmentDocument | null> {
    return this.assignmentModel
      .findOneAndUpdate(
        { customerId, active: true },
        { deliveryDate },
        { new: true },
      )
      .exec();
  }

  /**
   * Returns bin types currently assigned to a customer (via active assignments),
   * with assignment metadata attached for customer detail views.
   */
  async findByCustomer(customerId: string): Promise<BinWithAssignment[]> {
    const assignments = await this.assignmentModel
      .find({ customerId, active: true })
      .sort({ createdAt: -1 })
      .exec();
    if (!assignments.length) {
      return [];
    }

    const binIds = assignments.map((a) => a.binId);
    const bins = await this.binModel.find({ _id: { $in: binIds } }).exec();
    const binById = new Map(bins.map((b) => [String(b.id), b]));

    return assignments
      .map((assignment) => {
        const bin = binById.get(String(assignment.binId));
        if (!bin) {
          return null;
        }
        const plain = bin.toJSON() as unknown as Record<string, unknown>;
        return {
          ...plain,
          id: String(bin.id),
          assignmentId: String(assignment.id),
          customerId: assignment.customerId,
          deliveryDate: assignment.deliveryDate,
        } as unknown as BinWithAssignment;
      })
      .filter((item): item is BinWithAssignment => item != null);
  }

  /**
   * Compatibility helpers used by subscription flows that previously called assign/unassign.
   */
  async assign(
    id: string,
    customerId: string,
    _active = true,
    options?: {
      deliveryDate?: string | null;
      subscriptionId?: string | null;
    },
  ): Promise<BinDocument | null> {
    const { bin } = await this.take(id, customerId, options);
    return bin;
  }

  async unassign(id: string): Promise<BinDocument | null> {
    const assignment = await this.assignmentModel
      .findOne({ binId: id, active: true })
      .exec();
    if (!assignment) {
      return this.binModel.findById(id).exec();
    }
    const { bin } = await this.release(String(assignment.id));
    return bin;
  }

  async getStats() {
    const [stats] = await this.binModel.aggregate<{
      totalBins: number;
      totalCapacity: number;
      availableBins: number;
      assignedBins: number;
    }>([
      {
        $group: {
          _id: null,
          totalBins: { $sum: { $ifNull: ['$totalCount', 0] } },
          totalCapacity: { $sum: { $ifNull: ['$capacity', 0] } },
          availableBins: { $sum: { $ifNull: ['$availableCount', 0] } },
          assignedBins: {
            $sum: {
              $subtract: [
                { $ifNull: ['$totalCount', 0] },
                { $ifNull: ['$availableCount', 0] },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalBins: 1,
          totalCapacity: 1,
          availableBins: 1,
          assignedBins: 1,
        },
      },
    ]);

    return (
      stats ?? {
        totalBins: 0,
        totalCapacity: 0,
        availableBins: 0,
        assignedBins: 0,
      }
    );
  }
}
