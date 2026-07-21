import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/roles.enum';
import { normalizePhone, phoneToEmail } from '../auth/phone.util';
import { User, UserDocument } from './schemas/user.schema';

export const DEFAULT_ADMIN = {
  email: 'admin@raqi.local',
  password: 'Admin@123',
  name: 'System Admin',
} as const;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSparseUniqueIndexes();
    await this.backfillMissingEmailsFromPhone();
    await this.ensureDefaultAdmin();
  }

  /**
   * Production DBs may have a non-sparse unique email index from an older schema.
   * That makes a second user without email fail with E11000 ("email already exists").
   */
  private async ensureSparseUniqueIndexes(): Promise<void> {
    const collection = this.userModel.collection;
    try {
      const indexes = await collection.indexes();
      for (const index of indexes) {
        const key = index.key as Record<string, number> | undefined;
        if (!key) continue;
        const fields = Object.keys(key);
        if (fields.length !== 1) continue;
        const field = fields[0];
        if (field !== 'email' && field !== 'phone') continue;
        if (index.unique && index.sparse) continue;
        if (index.name === '_id_') continue;
        const name = index.name;
        if (!name) continue;
        this.logger.warn(
          `Recreating users.${field} index as unique+sparse (was unique=${Boolean(index.unique)} sparse=${Boolean(index.sparse)})`,
        );
        await collection.dropIndex(name);
      }
      await this.userModel.syncIndexes();
    } catch (error) {
      this.logger.warn(
        `Could not ensure sparse user indexes: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Fill missing emails from phone so unique email index never sees duplicate nulls. */
  private async backfillMissingEmailsFromPhone(): Promise<void> {
    try {
      const users = await this.userModel
        .find({
          phone: { $exists: true, $nin: [null, ''] },
          $or: [{ email: null }, { email: { $exists: false } }, { email: '' }],
        })
        .exec();
      let updated = 0;
      for (const user of users) {
        if (!user.phone) continue;
        const email = phoneToEmail(user.phone);
        const clash = await this.userModel
          .findOne({ email, _id: { $ne: user._id } })
          .exec();
        if (clash) continue;
        user.email = email;
        await user.save();
        updated += 1;
      }
      if (updated > 0) {
        this.logger.log(`Backfilled email from phone for ${updated} user(s)`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not backfill missing emails: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async ensureDefaultAdmin(options?: { resetPassword?: boolean }): Promise<UserDocument> {
    const admin = await this.ensureAdminUser(
      {
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password,
        name: DEFAULT_ADMIN.name,
      },
      options,
    );
    this.logger.log(`Default admin ready: ${DEFAULT_ADMIN.email}`);
    return admin;
  }

  async ensureAdminUser(
    input: { email: string; password: string; name: string },
    options?: { resetPassword?: boolean },
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: input.email });
    if (existing) {
      const updates: Partial<User> = {};
      if (existing.role !== Role.Admin) {
        updates.role = Role.Admin;
      }
      if (existing.status !== 'active') {
        updates.status = 'active';
      }
      if (Object.keys(updates).length > 0) {
        await this.userModel.updateOne({ _id: existing._id }, updates);
      }
      if (options?.resetPassword) {
        await this.setPassword(String(existing.id), input.password);
      }
      return (await this.userModel.findById(existing.id).exec())!;
    }

    return this.userModel.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
      role: Role.Admin,
      status: 'active',
      phoneVerified: false,
    });
  }

  async create(input: {
    email?: string;
    name: string;
    password: string;
    role: Role;
    phone?: string;
    phoneVerified?: boolean;
  }): Promise<UserDocument> {
    const phone = input.phone ? normalizePhone(input.phone) : undefined;
    // Prefer explicit email; otherwise derive a unique placeholder from phone.
    // Avoids Mongo unique-index collisions on missing/null email.
    const email =
      input.email?.trim() || (phone ? phoneToEmail(phone) : undefined);

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    return this.userModel.create({
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, 10),
      role: input.role,
      phone,
      phoneVerified: input.phoneVerified ?? false,
      ...(email ? { email } : {}),
    });
  }

  async createCustomerUser(input: {
    phone: string;
    name: string;
    password: string;
    email?: string;
    phoneVerified?: boolean;
  }): Promise<UserDocument> {
    const normalizedPhone = normalizePhone(input.phone);
    return this.create({
      email: input.email,
      phone: normalizedPhone,
      name: input.name,
      password: input.password,
      role: Role.Customer,
      phoneVerified: input.phoneVerified ?? true,
    });
  }

  findStaff(): Promise<UserDocument[]> {
    return this.userModel.find({ role: { $ne: Role.Customer } }).exec();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  findByRole(role: Role): Promise<UserDocument[]> {
    return this.userModel.find({ role, status: 'active' }).exec();
  }

  findByIds(ids: string[]): Promise<UserDocument[]> {
    if (!ids.length) {
      return Promise.resolve([]);
    }
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    const normalized = email.trim();
    if (!normalized) {
      return Promise.resolve(null);
    }
    return this.userModel.findOne({ email: normalized }).exec();
  }

  findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone: normalizePhone(phone) }).exec();
  }

  update(
    id: string,
    patch: Omit<Partial<User>, 'email'> & { email?: string | null },
  ): Promise<UserDocument | null> {
    const { email, ...rest } = patch;
    const updateOps: Record<string, unknown> = {};

    if (Object.keys(rest).length > 0) {
      updateOps.$set = rest;
    }
    if (email === null) {
      updateOps.$unset = { email: 1 };
    } else if (email !== undefined) {
      updateOps.$set = { ...(updateOps.$set as object | undefined), email };
    }

    if (!updateOps.$set && !updateOps.$unset) {
      return this.findById(id);
    }

    return this.userModel.findByIdAndUpdate(id, updateOps, { new: true }).exec();
  }

  updateStatus(
    id: string,
    status: 'active' | 'inactive',
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async markPhoneVerified(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { phoneVerified: true }, { new: true })
      .exec();
  }

  async setPassword(id: string, password: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { passwordHash: await bcrypt.hash(password, 10) })
      .exec();
  }

  async deactivate(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { status: 'inactive', deactivatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async reactivate(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { status: 'active', deactivatedAt: null },
        { new: true },
      )
      .exec();
  }

  async softDelete(id: string): Promise<UserDocument | null> {
    const deletedAt = new Date();
    const tombstone = `deleted_${id}_${deletedAt.getTime()}`;
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'inactive',
            deletedAt,
            deactivatedAt: deletedAt,
            name: 'محذوف',
            email: `${tombstone}@deleted.local`,
            phoneVerified: false,
            passwordHash: await bcrypt.hash(
              `deleted:${id}:${deletedAt.getTime()}`,
              10,
            ),
          },
          $unset: { phone: 1 },
        },
        { new: true },
      )
      .exec();
  }

  async clearPhone(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $unset: { phone: 1 } }, { new: true })
      .exec();
  }

  async verifyPassword(user: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  sanitize(user: UserDocument): Record<string, unknown> {
    const json = user.toJSON() as unknown as Record<string, unknown>;
    delete json.passwordHash;
    return json;
  }
}
