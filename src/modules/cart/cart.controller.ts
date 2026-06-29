import { Request, Response } from 'express';
import * as CartService from './cart.service';
import { AddToCartInput } from './cart.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { UnauthorizedError } from '../../utils/AppError';

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { productId } = req.body as AddToCartInput;
  const item = await CartService.addToCart(req.user.sub, productId);
  sendSuccess(res, item, 'Product added to cart', 201);
});

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const cart = await CartService.getCart(req.user.sub);
  sendSuccess(res, cart, 'Cart retrieved');
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await CartService.removeFromCart(req.user.sub, req.params.productId);
  sendSuccess(res, null, 'Item removed from cart');
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await CartService.clearCart(req.user.sub);
  sendSuccess(res, null, 'Cart cleared');
});
