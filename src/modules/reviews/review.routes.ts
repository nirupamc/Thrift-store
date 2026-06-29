import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as ReviewController from './review.controller';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/protect';
import {
  createReviewSchema,
  listReviewsByProductSchema,
  listReviewsByStoreSchema,
} from './review.schema';

const router = Router();

// ── Buyer-only ────────────────────────────────────────────────────────────────

router.post(
  '/',
  protect,
  restrictTo(UserRole.BUYER),
  validate(createReviewSchema),
  ReviewController.createReview,
);

// ── Public ────────────────────────────────────────────────────────────────────

router.get(
  '/product/:productId',
  validate(listReviewsByProductSchema),
  ReviewController.getProductReviews,
);

router.get(
  '/store/:storeId',
  validate(listReviewsByStoreSchema),
  ReviewController.getStoreReviews,
);

export { router as reviewRouter };
