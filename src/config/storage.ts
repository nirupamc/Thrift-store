import path from 'path';
import { mkdirSync } from 'fs';
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

// ─── Store banner storage ─────────────────────────────────────────────────────

const STORE_BANNERS_DIR = path.join(process.cwd(), 'public', 'uploads', 'stores');
try { mkdirSync(STORE_BANNERS_DIR, { recursive: true }); } catch {}

export const storeBannerDiskStorage = multer.diskStorage({
  destination(_req, _file, cb) { cb(null, STORE_BANNERS_DIR); },
  filename(_req, file, cb) {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

export const storeBannerStorageConfig: multer.Options = {
  storage: storeBannerDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
};

// ─── Font storage ─────────────────────────────────────────────────────────────

const FONTS_DIR = path.join(process.cwd(), 'public', 'uploads', 'fonts');
try { mkdirSync(FONTS_DIR, { recursive: true }); } catch {}

export const fontDiskStorage = multer.diskStorage({
  destination(_req, _file, cb) { cb(null, FONTS_DIR); },
  filename(_req, file, cb) {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

function fontFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.woff2' && ext !== '.ttf') {
    cb(new AppError('Only .woff2 and .ttf font files are allowed', 400, 'INVALID_FILE_TYPE'));
    return;
  }
  cb(null, true);
}

export const fontStorageConfig: multer.Options = {
  storage: fontDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: fontFileFilter,
};
