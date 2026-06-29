// Local-disk replacement for Cloudinary. Multer (diskStorage) has already
// written the file to public/uploads/ by the time these helpers are called.
// We just build the public URL from the saved filename.

import { env } from './env';

export async function uploadProductImages(files: Express.Multer.File[]): Promise<string[]> {
  return files.map((f) => `${env.BASE_URL}/uploads/${f.filename}`);
}

export async function uploadAvatar(file: Express.Multer.File): Promise<string> {
  return `${env.BASE_URL}/uploads/${file.filename}`;
}
