import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

export const GALLERY_UPLOAD_DIR = join(process.cwd(), 'uploads', 'gallery');

export function ensureGalleryUploadDir() {
  if (!existsSync(GALLERY_UPLOAD_DIR)) {
    mkdirSync(GALLERY_UPLOAD_DIR, { recursive: true });
  }
}

export const galleryImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureGalleryUploadDir();
    cb(null, GALLERY_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  },
});

export function galleryImageFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = extname(file.originalname).toLowerCase();
  if (!allowed.includes(extension)) {
    cb(new Error('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
}

export function buildGalleryImageUrl(filename: string): string {
  return `/uploads/gallery/${filename}`;
}
