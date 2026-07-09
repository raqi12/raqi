import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CompleteTaskDto, SkipTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  findAll(): Promise<TaskDocument[]> {
    return this.taskModel.find().exec();
  }

  findById(id: string): Promise<TaskDocument | null> {
    return this.taskModel.findById(id).exec();
  }

  findByDriver(driverId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ driverId }).exec();
  }

  findByCustomer(customerId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ customerId }).exec();
  }

  countCompleted(): Promise<number> {
    return this.taskModel.countDocuments({ status: TaskStatus.Completed }).exec();
  }

  async generate(date: string, areaId: string): Promise<TaskDocument[]> {
    const subscriptions =
      await this.subscriptionsService.findForGeneration(areaId);
    const created = await Promise.all(
      subscriptions.map((subscription) =>
        this.taskModel.create({
          subscriptionId: String(subscription.id),
          customerId: subscription.customerId,
          areaId,
          scheduledDate: date,
          status: TaskStatus.Pending,
        }),
      ),
    );
    return created;
  }

  assign(id: string, driverId: string): Promise<TaskDocument | null> {
    return this.taskModel
      .findByIdAndUpdate(
        id,
        { driverId, status: TaskStatus.Assigned },
        { new: true },
      )
      .exec();
  }

  start(id: string): Promise<TaskDocument | null> {
    return this.taskModel
      .findByIdAndUpdate(
        id,
        { status: TaskStatus.InProgress, startedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  complete(id: string, body: CompleteTaskDto): Promise<TaskDocument | null> {
    return this.taskModel
      .findByIdAndUpdate(
        id,
        {
          status: TaskStatus.Completed,
          photo: body.photo ?? null,
          note: body.note ?? null,
          completedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  skip(id: string, body: SkipTaskDto): Promise<TaskDocument | null> {
    if (!body.reason || !body.location) {
      throw new BadRequestException('Skip requires reason and location');
    }
    return this.taskModel
      .findByIdAndUpdate(
        id,
        {
          status: TaskStatus.Skipped,
          skipReason: body.reason,
          skipLocation: body.location,
          skippedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }
}
