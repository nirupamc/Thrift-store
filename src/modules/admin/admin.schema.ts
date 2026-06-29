import { z } from 'zod';
import { OrderStatus, PayoutStatus } from '@prisma/client';

// ── Reusable fragments ────────────────────────────────────────────────────────

const pagination = {
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

// String query param "true"/"false" → boolean (z.coerce.boolean() is wrong here
// because non-empty strings are truthy, making "false" → true)
const boolParam = z.enum(['true', 'false']).transform((v) => v === 'true').optional();

// ── Vendor list ───────────────────────────────────────────────────────────────

export const listVendorsSchema = z.object({
  query: z.object({
    ...pagination,
    search:      z.string().max(100).optional(),
    isApproved:  boolParam,
    isSuspended: boolParam,
  }),
});

export const vendorIdSchema = z.object({
  params: z.object({ vendorId: z.string().cuid('Invalid vendor ID') }),
});

// ── Buyer list ────────────────────────────────────────────────────────────────

export const listBuyersSchema = z.object({
  query: z.object({
    ...pagination,
    search:      z.string().max(100).optional(),
    isSuspended: boolParam,
  }),
});

export const buyerIdSchema = z.object({
  params: z.object({ buyerId: z.string().cuid('Invalid buyer ID') }),
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const adminOrdersSchema = z.object({
  query: z.object({
    ...pagination,
    status:   z.nativeEnum(OrderStatus).optional(),
    dateFrom: z.string().datetime({ message: 'dateFrom must be ISO 8601' }).optional(),
    dateTo:   z.string().datetime({ message: 'dateTo must be ISO 8601' }).optional(),
  }),
});

// ── Payouts ───────────────────────────────────────────────────────────────────

export const adminPayoutsSchema = z.object({
  query: z.object({
    ...pagination,
    status: z.nativeEnum(PayoutStatus).optional(),
  }),
});

export const payoutIdSchema = z.object({
  params: z.object({ payoutId: z.string().cuid('Invalid payout ID') }),
});

// ── Products ──────────────────────────────────────────────────────────────────

export const adminProductIdSchema = z.object({
  params: z.object({ productId: z.string().cuid('Invalid product ID') }),
});

// ── Drops ─────────────────────────────────────────────────────────────────────

export const adminDropsSchema = z.object({
  query: z.object({
    ...pagination,
    storeId: z.string().cuid().optional(),
  }),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ListVendorsQuery  = z.infer<typeof listVendorsSchema>['query'];
export type ListBuyersQuery   = z.infer<typeof listBuyersSchema>['query'];
export type AdminOrdersQuery  = z.infer<typeof adminOrdersSchema>['query'];
export type AdminPayoutsQuery = z.infer<typeof adminPayoutsSchema>['query'];
export type AdminDropsQuery   = z.infer<typeof adminDropsSchema>['query'];
