import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as CartController from './cart.controller';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/protect';
import { addToCartSchema, removeFromCartSchema } from './cart.schema';

const router = Router();

const buyerOnly = [protect, restrictTo(UserRole.BUYER)];

router.get ('/',            ...buyerOnly,                                 CartController.getCart);
router.post('/',            ...buyerOnly, validate(addToCartSchema),      CartController.addToCart);
router.delete('/:productId',...buyerOnly, validate(removeFromCartSchema), CartController.removeFromCart);
router.delete('/',          ...buyerOnly,                                 CartController.clearCart);

export { router as cartRouter };
