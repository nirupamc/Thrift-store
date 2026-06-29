import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    // Sanitise the original name: collapse spaces, strip non-safe chars
    const safe = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400, 'INVALID_FILE_TYPE'));
    return;
  }
  cb(null, true);
}

export const storageConfig: multer.Options = {
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter,
};
