import { Router, Request, Response } from 'express';
import { authRouter }     from '../modules/auth/auth.routes';
import { productRouter }  from '../modules/products/product.routes';
import { storeRouter }    from '../modules/stores/store.routes';
import { cartRouter }     from '../modules/cart/cart.routes';
import { orderRouter }    from '../modules/orders/order.routes';
import { reviewRouter }   from '../modules/reviews/review.routes';
import { adminRouter }    from '../modules/admin/admin.routes';
import { categoryRouter } from '../modules/categories/category.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ThriftBazaar API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

router.use('/auth',       authRouter);
router.use('/products',   productRouter);
router.use('/stores',     storeRouter);
router.use('/cart',       cartRouter);
router.use('/orders',     orderRouter);
router.use('/reviews',    reviewRouter);
router.use('/admin',      adminRouter);
router.use('/categories', categoryRouter);

export { router };
