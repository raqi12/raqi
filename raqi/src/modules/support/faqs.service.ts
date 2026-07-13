import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFaqDto, UpdateFaqDto } from './dto/support.dto';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { DEFAULT_FAQS } from './support.defaults';

@Injectable()
export class FaqsService {
  constructor(
    @InjectModel(Faq.name) private readonly faqModel: Model<FaqDocument>,
  ) {}

  async ensureDefaults(): Promise<void> {
    const count = await this.faqModel.countDocuments().exec();
    if (count > 0) {
      return;
    }
    await this.faqModel.insertMany(DEFAULT_FAQS);
  }

  findActive(): Promise<FaqDocument[]> {
    return this.faqModel.find({ active: true }).sort({ sortOrder: 1 }).exec();
  }

  findAll(): Promise<FaqDocument[]> {
    return this.faqModel.find().sort({ sortOrder: 1 }).exec();
  }

  async create(input: CreateFaqDto): Promise<FaqDocument> {
    const sortOrder =
      input.sortOrder ??
      (await this.faqModel.countDocuments().exec());
    return this.faqModel.create({
      question: input.question,
      answer: input.answer,
      sortOrder,
      active: input.active ?? true,
    });
  }

  update(id: string, patch: UpdateFaqDto): Promise<FaqDocument | null> {
    return this.faqModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  remove(id: string): Promise<FaqDocument | null> {
    return this.faqModel.findByIdAndDelete(id).exec();
  }
}
