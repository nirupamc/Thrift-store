import { Request, Response } from 'express';
import * as AdminService from './admin.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import type {
  ListVendorsQuery,
  ListBuyersQuery,
  AdminOrdersQuery,
  AdminPayoutsQuery,
  AdminDropsQuery,
} from './admin.schema';

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await AdminService.getPlatformStats();
  sendSuccess(res, stats, 'Platform stats retrieved');
});

// ── Vendors ───────────────────────────────────────────────────────────────────

export const listVendors = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListVendorsQuery;
  const { data, total } = await AdminService.listVendors(query);
  sendPaginated(res, data, total, query.page, query.limit);
});

export const approveVendor = asyncHandler(async (req: Request, res: Response) => {
  const result = await AdminService.approveVendor(req.params.vendorId);
  sendSuccess(res, result, 'Vendor approved successfully');
});

export const suspendVendor = asyncHandler(async (req: Request, res: Response) => {
  const result = await AdminService.suspendVendor(req.params.vendorId);
  sendSuccess(res, result, 'Vendor suspended');
});

// ── Buyers ────────────────────────────────────────────────────────────────────

export const listBuyers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListBuyersQuery;
  const { data, total } = await AdminService.listBuyers(query);
  sendPaginated(res, data, total, query.page, query.limit);
});

export const suspendBuyer = asyncHandler(async (req: Request, res: Response) => {
  const result = await AdminService.suspendBuyer(req.params.buyerId);
  sendSuccess(res, result, 'Buyer suspended');
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AdminOrdersQuery;
  const { data, total } = await AdminService.listOrders(query);
  sendPaginated(res, data, total, query.page, query.limit);
});

// ── Payouts ───────────────────────────────────────────────────────────────────

export const listPayouts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AdminPayoutsQuery;
  const { data, total } = await AdminService.listPayouts(query);
  sendPaginated(res, data, total, query.page, query.limit);
});

export const markPayoutPaid = asyncHandler(async (req: Request, res: Response) => {
  const payout = await AdminService.markPayoutPaid(req.params.payoutId);
  sendSuccess(res, payout, 'Payout marked as paid');
});

// ── Products ──────────────────────────────────────────────────────────────────

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await AdminService.adminDeleteProduct(req.params.productId);
  sendSuccess(res, null, 'Product removed from platform');
});

// ── Drops ─────────────────────────────────────────────────────────────────────

export const listDrops = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AdminDropsQuery;
  const { data, total } = await AdminService.listDrops(query);
  sendPaginated(res, data, total, query.page, query.limit);
});
