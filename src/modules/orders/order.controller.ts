import { Request, Response } from 'express';
import * as OrderService from './order.service';
import { CheckoutInput, VerifyPaymentInput } from './order.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { UnauthorizedError } from '../../utils/AppError';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await OrderService.checkout(req.user.sub, req.body as CheckoutInput);
  sendSuccess(res, result, 'Order created — complete payment', 201);
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await OrderService.verifyPayment(req.user.sub, req.body as VerifyPaymentInput);
  sendSuccess(res, result, 'Payment verified — order confirmed');
});

export const getBuyerOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const page  = Number(req.query.page  ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { data, total } = await OrderService.getBuyerOrders(req.user.sub, { page, limit });
  sendPaginated(res, data, total, page, limit);
});

export const getBuyerOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const order = await OrderService.getBuyerOrder(req.user.sub, req.params.orderId);
  sendSuccess(res, order, 'Order retrieved');
});

export const getVendorOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const page  = Number(req.query.page  ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { data, total } = await OrderService.getVendorOrders(req.user.sub, { page, limit });
  sendPaginated(res, data, total, page, limit);
});

export const updateSubOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const sub = await OrderService.updateSubOrderStatus(
    req.user.sub,
    req.params.subOrderId,
    req.body.status,
  );
  sendSuccess(res, sub, 'Sub-order status updated');
});
