import multer from 'multer';
import { storageConfig, fontStorageConfig, storeBannerStorageConfig } from '../config/storage';

const multerInstance = multer(storageConfig);

/** Accepts up to 5 images under the field name "images". */
export const uploadImages = multerInstance.array('images', 5);

/** Accepts a single image under the field name "avatarImage". */
export const uploadSingleImage = multerInstance.single('avatarImage');

/** Accepts avatarImage + bannerImage in a single multipart request. */
export const uploadStoreImages = multerInstance.fields([
  { name: 'avatarImage', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
]);

/** Accepts a single font file (.woff2 or .ttf) under the field name "fontFile". */
export const uploadFont = multer(fontStorageConfig).single('fontFile');

/** Accepts a single banner image under the field name "bannerImage", saves to public/uploads/stores/. */
export const uploadStoreBannerSingle = multer(storeBannerStorageConfig).single('bannerImage');
