import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AreasService } from '../areas/areas.service';
import { DriversService } from '../drivers/drivers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CompleteTaskDto, SkipTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly driversService: DriversService,
    private readonly areasService: AreasService,
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
      subscriptions.map(async (subscription) => {
        const task = await this.taskModel.create({
          subscriptionId: String(subscription.id),
          customerId: subscription.customerId,
          areaId,
          scheduledDate: date,
          status: TaskStatus.Pending,
        });

        if (subscription.driverId) {
          return this.assign(String(task.id), subscription.driverId);
        }

        return task;
      }),
    );
    return created.filter((task): task is TaskDocument => task !== null);
  }

  async assign(id: string, driverId: string): Promise<TaskDocument | null> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      return null;
    }

    const driver = await this.driversService.findById(driverId);
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }
    if (driver.status !== 'active') {
      throw new BadRequestException('Driver is not active');
    }

    const area = await this.areasService.findById(task.areaId);
    if (!area) {
      throw new BadRequestException('Task area not found');
    }

    if (driver.areaId !== task.areaId || driver.cityId !== area.cityId) {
      throw new BadRequestException(
        'Driver must serve the same city and area as the task',
      );
    }

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
