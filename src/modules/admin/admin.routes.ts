import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as AdminController from './admin.controller';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/protect';
import {
  listVendorsSchema,
  vendorIdSchema,
  listBuyersSchema,
  buyerIdSchema,
  adminOrdersSchema,
  adminPayoutsSchema,
  payoutIdSchema,
  adminProductIdSchema,
  adminDropsSchema,
} from './admin.schema';

const router = Router();

// All admin routes require a valid JWT and ADMIN role
router.use(protect, restrictTo(UserRole.ADMIN));

// ── Platform stats ────────────────────────────────────────────────────────────
router.get('/stats', AdminController.getPlatformStats);

// ── Vendor management ─────────────────────────────────────────────────────────
router.get('/vendors',                        validate(listVendorsSchema), AdminController.listVendors);
router.patch('/vendors/:vendorId/approve',    validate(vendorIdSchema),    AdminController.approveVendor);
router.patch('/vendors/:vendorId/suspend',    validate(vendorIdSchema),    AdminController.suspendVendor);

// ── Buyer management ──────────────────────────────────────────────────────────
router.get('/buyers',                         validate(listBuyersSchema),  AdminController.listBuyers);
router.patch('/buyers/:buyerId/suspend',      validate(buyerIdSchema),     AdminController.suspendBuyer);

// ── Order management ──────────────────────────────────────────────────────────
router.get('/orders',                         validate(adminOrdersSchema), AdminController.listOrders);

// ── Payout management ─────────────────────────────────────────────────────────
router.get('/payouts',                        validate(adminPayoutsSchema),    AdminController.listPayouts);
router.patch('/payouts/:payoutId/mark-paid',  validate(payoutIdSchema),        AdminController.markPayoutPaid);

// ── Product moderation ────────────────────────────────────────────────────────
router.delete('/products/:productId',         validate(adminProductIdSchema),  AdminController.deleteProduct);

// ── Drop oversight ────────────────────────────────────────────────────────────
router.get('/drops',                          validate(adminDropsSchema),      AdminController.listDrops);

export { router as adminRouter };
