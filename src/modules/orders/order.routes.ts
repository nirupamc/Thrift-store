import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as OrderController from './order.controller';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/protect';
import {
  checkoutSchema,
  verifyPaymentSchema,
  orderIdSchema,
  subOrderStatusSchema,
  paginationSchema,
} from './order.schema';

const router = Router();

// ── Buyer endpoints ───────────────────────────────────────────────────────────

router.post(
  '/checkout',
  protect, restrictTo(UserRole.BUYER),
  validate(checkoutSchema),
  OrderController.checkout,
);

router.post(
  '/verify',
  protect, restrictTo(UserRole.BUYER),
  validate(verifyPaymentSchema),
  OrderController.verifyPayment,
);

router.get(
  '/',
  protect, restrictTo(UserRole.BUYER),
  validate(paginationSchema),
  OrderController.getBuyerOrders,
);

// ── Vendor endpoints — must be defined BEFORE /:orderId to avoid shadowing ────

router.get(
  '/vendor',
  protect, restrictTo(UserRole.VENDOR),
  validate(paginationSchema),
  OrderController.getVendorOrders,
);

router.patch(
  '/vendor/:subOrderId/status',
  protect, restrictTo(UserRole.VENDOR),
  validate(subOrderStatusSchema),
  OrderController.updateSubOrderStatus,
);

// ── Buyer: single order — defined LAST so /vendor doesn't match :orderId ──────

router.get(
  '/:orderId',
  protect, restrictTo(UserRole.BUYER),
  validate(orderIdSchema),
  OrderController.getBuyerOrder,
);

export { router as orderRouter };
