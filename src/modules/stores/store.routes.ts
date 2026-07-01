import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as StoreController from './store.controller';
import * as DropController from '../drops/drop.controller';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/protect';
import {
  createStoreSchema,
  updateStoreSchema,
  listStoresSchema,
  storeIdSchema,
  followingSchema,
} from './store.schema';
import { createDropSchema } from '../drops/drop.schema';
import { storeProductsSchema } from '../products/product.schema';
import { getStoreProducts } from '../products/product.controller';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

router.get(
  '/',
  validate(listStoresSchema),
  StoreController.listStores,
);

// IMPORTANT: /following and /mine must be defined BEFORE /:storeId — otherwise
// Express matches these literal strings as a storeId path parameter.
router.get(
  '/following',
  protect,
  restrictTo(UserRole.BUYER),
  validate(followingSchema),
  StoreController.getFollowedStores,
);

router.get(
  '/mine',
  protect,
  restrictTo(UserRole.VENDOR),
  StoreController.getMyStore,
);

router.get(
  '/:storeId',
  validate(storeIdSchema),
  StoreController.getStore,
);

router.get(
  '/:storeId/products',
  validate(storeProductsSchema),
  getStoreProducts,
);

// ── Vendor-only ───────────────────────────────────────────────────────────────

router.post(
  '/',
  protect,
  restrictTo(UserRole.VENDOR),
  validate(createStoreSchema),
  StoreController.createStore,
);

router.patch(
  '/:storeId',
  protect,
  restrictTo(UserRole.VENDOR),
  StoreController.handleAvatarUpload,   // multer before validate — body not parsed yet
  validate(updateStoreSchema),
  StoreController.updateStore,
);

router.patch(
  '/:storeId/font',
  protect,
  restrictTo(UserRole.VENDOR),
  StoreController.handleFontUpload,
  StoreController.uploadStoreFont,
);

router.post(
  '/:storeId/upload-image',
  protect,
  restrictTo(UserRole.VENDOR),
  StoreController.handleBannerUpload,
  StoreController.uploadBannerImage,
);

router.get(
  '/:storeId/stats',
  protect,
  restrictTo(UserRole.VENDOR),
  validate(storeIdSchema),
  StoreController.getStoreStats,
);

router.post(
  '/:storeId/drops',
  protect,
  restrictTo(UserRole.VENDOR),
  validate(createDropSchema),
  DropController.createDrop,
);

// ── Buyer-only ────────────────────────────────────────────────────────────────

router.post(
  '/:storeId/follow',
  protect,
  restrictTo(UserRole.BUYER),
  validate(storeIdSchema),
  StoreController.followStore,
);

router.delete(
  '/:storeId/follow',
  protect,
  restrictTo(UserRole.BUYER),
  validate(storeIdSchema),
  StoreController.unfollowStore,
);

export { router as storeRouter };
