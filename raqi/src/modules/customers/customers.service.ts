import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerType } from '../../common/customer-type';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Address, AddressDocument } from './schemas/address.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  create(input: {
    userId: string;
    type: CustomerType;
  }): Promise<CustomerDocument> {
    return this.customerModel.create(input);
  }

  findAll(): Promise<CustomerDocument[]> {
    return this.customerModel.find().exec();
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

  createAddress(
    customerId: string,
    input: { label: string; area: string; details: string },
  ): Promise<AddressDocument> {
    return this.addressModel.create({ customerId, ...input });
  }

  listAddresses(customerId: string): Promise<AddressDocument[]> {
    return this.addressModel.find({ customerId }).exec();
  }

  findAddressById(id: string): Promise<AddressDocument | null> {
    return this.addressModel.findById(id).exec();
  }

  updateAddress(
    id: string,
    patch: Partial<Address>,
  ): Promise<AddressDocument | null> {
    return this.addressModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }
}
