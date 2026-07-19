import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

export const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

export function ensureAvatarUploadDir() {
  if (!existsSync(AVATAR_UPLOAD_DIR)) {
    mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
  }
}

export const avatarImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureAvatarUploadDir();
    cb(null, AVATAR_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  },
});

export function avatarImageFilter(
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

export function buildAvatarUrl(filename: string): string {
  return `/uploads/avatars/${filename}`;
}
