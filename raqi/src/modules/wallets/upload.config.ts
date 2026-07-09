import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

export const DEPOSITS_UPLOAD_DIR = join(process.cwd(), 'uploads', 'deposits');

export function ensureDepositsUploadDir() {
  if (!existsSync(DEPOSITS_UPLOAD_DIR)) {
    mkdirSync(DEPOSITS_UPLOAD_DIR, { recursive: true });
  }
}

export const depositEvidenceStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureDepositsUploadDir();
    cb(null, DEPOSITS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  },
});

export function depositEvidenceFilter(
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

export function buildEvidenceUrl(filename: string): string {
  return `/uploads/deposits/${filename}`;
}
