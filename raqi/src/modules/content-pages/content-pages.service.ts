import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  isContentPageSlug,
  type ContentPageSlug,
} from './content-page.slugs';
import { DEFAULT_CONTENT_PAGES } from './content-pages.defaults';
import { UpdateContentPageDto } from './dto/content-page.dto';
import {
  ContentPage,
  ContentPageDocument,
} from './schemas/content-page.schema';

export type ContentPagePayload = {
  slug: ContentPageSlug;
  title: string;
  body: string;
  updatedAt: string | null;
};

@Injectable()
export class ContentPagesService {
  constructor(
    @InjectModel(ContentPage.name)
    private readonly pageModel: Model<ContentPageDocument>,
  ) {}

  parseSlugOrThrow(slug: string): ContentPageSlug {
    if (!isContentPageSlug(slug)) {
      throw new BadRequestException(
        `Invalid page slug. Expected: privacy or instructions`,
      );
    }
    return slug;
  }

  async ensureDefaults(): Promise<void> {
    await Promise.all(
      (Object.keys(DEFAULT_CONTENT_PAGES) as ContentPageSlug[]).map(
        async (slug) => {
          const existing = await this.pageModel.findOne({ slug }).exec();
          if (existing) return;
          const defaults = DEFAULT_CONTENT_PAGES[slug];
          await this.pageModel.create({
            slug,
            title: defaults.title,
            body: defaults.body,
          });
        },
      ),
    );
  }

  async getBySlug(slug: ContentPageSlug): Promise<ContentPageDocument> {
    await this.ensureDefaults();
    const page = await this.pageModel.findOne({ slug }).exec();
    if (!page) {
      const defaults = DEFAULT_CONTENT_PAGES[slug];
      return this.pageModel.create({
        slug,
        title: defaults.title,
        body: defaults.body,
      });
    }
    return page;
  }

  async upsert(
    slug: ContentPageSlug,
    body: UpdateContentPageDto,
  ): Promise<ContentPageDocument> {
    const page = await this.pageModel
      .findOneAndUpdate(
        { slug },
        {
          slug,
          title: body.title,
          body: body.body,
        },
        { new: true, upsert: true },
      )
      .exec();
    if (!page) {
      return this.pageModel.create({
        slug,
        title: body.title,
        body: body.body,
      });
    }
    return page;
  }

  toPayload(page: ContentPageDocument): ContentPagePayload {
    const updatedAt = (page as ContentPageDocument & { updatedAt?: Date })
      .updatedAt;
    return {
      slug: page.slug,
      title: page.title,
      body: page.body,
      updatedAt: updatedAt?.toISOString?.() ?? null,
    };
  }
}
