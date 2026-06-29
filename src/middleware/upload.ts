import multer from 'multer';
import { storageConfig } from '../config/storage';

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
