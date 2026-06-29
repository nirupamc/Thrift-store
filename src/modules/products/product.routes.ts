import { Router } from 'express';
import * as ProductController from './product.controller';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/protect';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  productIdSchema,
} from './product.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.get(
  '/',
  validate(listProductsSchema),
  ProductController.listProducts,
);

router.get(
  '/:id',
  validate(productIdSchema),
  ProductController.getProduct,
);

router.post(
  '/',
  protect,
  restrictTo(UserRole.VENDOR),
  ProductController.handleUpload,
  validate(createProductSchema),
  ProductController.createProduct,
);

router.patch(
  '/:id',
  protect,
  restrictTo(UserRole.VENDOR),
  ProductController.handleUpload,
  validate(updateProductSchema),
  ProductController.updateProduct,
);

router.delete(
  '/:id',
  protect,
  restrictTo(UserRole.VENDOR),
  validate(productIdSchema),
  ProductController.deleteProduct,
);

export { router as productRouter };
