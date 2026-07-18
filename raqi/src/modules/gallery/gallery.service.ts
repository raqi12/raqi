import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateGalleryDto, UpdateGalleryDto } from './dto/gallery.dto';
import { Gallery, GalleryDocument } from './schemas/gallery.schema';

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name)
    private readonly galleryModel: Model<GalleryDocument>,
  ) {}

  findActive(): Promise<GalleryDocument[]> {
    return this.galleryModel
      .find({ active: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  findAll(): Promise<GalleryDocument[]> {
    return this.galleryModel.find().sort({ sortOrder: 1 }).exec();
  }

  findById(id: string): Promise<GalleryDocument | null> {
    return this.galleryModel.findById(id).exec();
  }

  async create(input: CreateGalleryDto): Promise<GalleryDocument> {
    const sortOrder =
      input.sortOrder ?? (await this.galleryModel.countDocuments().exec());
    return this.galleryModel.create({
      title: input.title.trim(),
      imageUrl: input.imageUrl.trim(),
      caption: input.caption?.trim() ?? '',
      linkUrl: input.linkUrl?.trim() ?? '',
      sortOrder,
      active: input.active ?? true,
    });
  }

  update(id: string, patch: UpdateGalleryDto): Promise<GalleryDocument | null> {
    const update: Partial<Gallery> = {};
    if (patch.title !== undefined) update.title = patch.title.trim();
    if (patch.imageUrl !== undefined) update.imageUrl = patch.imageUrl.trim();
    if (patch.caption !== undefined) update.caption = patch.caption.trim();
    if (patch.linkUrl !== undefined) update.linkUrl = patch.linkUrl.trim();
    if (patch.sortOrder !== undefined) update.sortOrder = patch.sortOrder;
    if (patch.active !== undefined) update.active = patch.active;
    return this.galleryModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  remove(id: string): Promise<GalleryDocument | null> {
    return this.galleryModel.findByIdAndDelete(id).exec();
  }
}
