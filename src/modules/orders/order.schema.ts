import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

// ─── Shared ───────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  query: z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

// ─── Checkout ─────────────────────────────────────────────────────────────────

const shippingAddressSchema = z.object({
  name:    z.string().min(2).max(100),
  phone:   z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  line1:   z.string().min(5).max(200),
  line2:   z.string().max(200).optional(),
  city:    z.string().min(2).max(100),
  state:   z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid Indian PIN code (6 digits)'),
});

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    notes:           z.string().max(500).optional(),
  }),
});

// ─── Verify payment ───────────────────────────────────────────────────────────

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId:   z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

// ─── Param-only ───────────────────────────────────────────────────────────────

export const orderIdSchema = z.object({
  params: z.object({ orderId: z.string().cuid('Invalid order ID') }),
});

// ─── Sub-order status ─────────────────────────────────────────────────────────

// Vendors drive: CONFIRMED → SHIPPED → DELIVERED
// CONFIRMED is set automatically on payment; vendor only advances from there
export const subOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([OrderStatus.SHIPPED, OrderStatus.DELIVERED]),
  }),
  params: z.object({ subOrderId: z.string().cuid('Invalid sub-order ID') }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CheckoutInput      = z.infer<typeof checkoutSchema>['body'];
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>['body'];
