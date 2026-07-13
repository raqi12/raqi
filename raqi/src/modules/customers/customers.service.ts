import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AreasService } from '../areas/areas.service';
import { CitiesService } from '../cities/cities.service';
import { UsersService } from '../users/users.service';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Address, AddressDocument } from './schemas/address.schema';

const DEFAULT_ADDRESS_LABEL = 'المنزل';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
    private readonly citiesService: CitiesService,
    private readonly areasService: AreasService,
    private readonly usersService: UsersService,
  ) {}

  async create(input: {
    userId: string;
    cityId: string;
    areaId: string;
  }): Promise<CustomerDocument> {
    await this.validateLocation(input.cityId, input.areaId);
    return this.customerModel.create(input);
  }

  findAll(): Promise<CustomerDocument[]> {
    return this.customerModel.find().exec();
  }

  async findAllForAdmin(): Promise<Record<string, unknown>[]> {
    const customers = await this.findAll();
    const users = await this.usersService.findByIds(
      customers.map((customer) => String(customer.userId)),
    );
    const userById = new Map(users.map((user) => [String(user.id), user]));
    return customers.map((customer) =>
      this.toAdminView(customer, userById.get(String(customer.userId))),
    );
  }

  async findByIdForAdmin(id: string): Promise<Record<string, unknown> | null> {
    const customer = await this.findById(id);
    if (!customer) {
      return null;
    }
    const user = await this.usersService.findById(String(customer.userId));
    return this.toAdminView(customer, user);
  }

  private toAdminView(
    customer: CustomerDocument,
    user?: { name: string; email: string; status?: string } | null,
  ): Record<string, unknown> {
    const json = customer.toJSON() as unknown as Record<string, unknown>;
    if (user) {
      json.name = user.name;
      json.email = user.email;
      if (user.status) {
        json.status = user.status;
      }
    }
    return json;
  }

  findById(id: string): Promise<CustomerDocument | null> {
    return this.customerModel.findById(id).exec();
  }

  findByUserId(userId: string): Promise<CustomerDocument | null> {
    return this.customerModel.findOne({ userId }).exec();
  }

  update(
    id: string,
    patch: Partial<Customer>,
  ): Promise<CustomerDocument | null> {
    return this.customerModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  async createInitialAddress(
    customerId: string,
    input: {
      cityId: string;
      areaId: string;
      label?: string;
      details?: string;
    },
  ): Promise<AddressDocument> {
    await this.validateLocation(input.cityId, input.areaId);
    return this.addressModel.create({
      customerId,
      cityId: input.cityId,
      areaId: input.areaId,
      label: input.label ?? DEFAULT_ADDRESS_LABEL,
      details: input.details ?? '',
      isActive: true,
    });
  }

  async createAddress(
    customerId: string,
    input: {
      label: string;
      cityId: string;
      areaId: string;
      details?: string;
    },
  ): Promise<AddressDocument> {
    await this.validateLocation(input.cityId, input.areaId);
    return this.addressModel.create({
      customerId,
      cityId: input.cityId,
      areaId: input.areaId,
      label: input.label,
      details: input.details ?? '',
      isActive: false,
    });
  }

  listAddresses(customerId: string): Promise<AddressDocument[]> {
    return this.addressModel
      .find({ customerId })
      .sort({ isActive: -1, createdAt: -1 })
      .exec();
  }

  findAddressById(id: string): Promise<AddressDocument | null> {
    return this.addressModel.findById(id).exec();
  }

  findActiveAddress(customerId: string): Promise<AddressDocument | null> {
    return this.addressModel.findOne({ customerId, isActive: true }).exec();
  }

  async updateAddress(
    id: string,
    patch: Partial<Pick<Address, 'label' | 'cityId' | 'areaId' | 'details'>>,
  ): Promise<AddressDocument | null> {
    const existing = await this.addressModel.findById(id).exec();
    if (!existing) {
      return null;
    }

    const cityId = patch.cityId ?? existing.cityId;
    const areaId = patch.areaId ?? existing.areaId;
    if (patch.cityId !== undefined || patch.areaId !== undefined) {
      await this.validateLocation(cityId, areaId);
    }

    return this.addressModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  async setActiveAddress(
    customerId: string,
    addressId: string,
  ): Promise<AddressDocument> {
    const address = await this.addressModel.findById(addressId).exec();
    if (!address || String(address.customerId) !== customerId) {
      throw new NotFoundException('Address not found');
    }

    await this.addressModel.updateMany(
      { customerId, isActive: true },
      { isActive: false },
    );

    address.isActive = true;
    await address.save();

    await this.customerModel.findByIdAndUpdate(customerId, {
      cityId: address.cityId,
      areaId: address.areaId,
    });

    return address;
  }

  async validateLocation(cityId: string, areaId: string): Promise<void> {
    const city = await this.citiesService.findById(cityId);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const area = await this.areasService.findById(areaId);
    if (!area) {
      throw new NotFoundException('Area not found');
    }

    if (area.cityId !== cityId) {
      throw new BadRequestException('Area does not belong to the selected city');
    }
  }
}
