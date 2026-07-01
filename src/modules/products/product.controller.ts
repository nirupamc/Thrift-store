import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as ProductService from './product.service';
import { CreateProductInput, UpdateProductInput, ListProductsQuery } from './product.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { uploadProductImages } from '../../config/cloudinary';
import { AppError, UnauthorizedError } from '../../utils/AppError';

// Wraps multer so its errors flow through our errorHandler
export function handleUpload(req: Request, res: Response, next: NextFunction): void {
  const { uploadImages } = require('../../middleware/upload');
  uploadImages(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Maximum 5 images allowed', 400, 'TOO_MANY_FILES'));
    }
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Each image must be under 5 MB', 400, 'FILE_TOO_LARGE'));
    }
    next(err);
  });
}

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const files = (req.files ?? []) as Express.Multer.File[];
  const imageUrls = files.length > 0 ? await uploadProductImages(files) : [];

  const product = await ProductService.createProduct(
    req.user.sub,
    req.body as CreateProductInput,
    imageUrls,
  );

  sendSuccess(res, product, 'Product listed successfully', StatusCodes.CREATED);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  // validate middleware has already coerced and defaulted all query values
  const query = req.query as unknown as ListProductsQuery;
  const { data, total } = await ProductService.listProducts(query);
  sendPaginated(res, data, total, query.page, query.limit);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.getProduct(req.params.id);
  sendSuccess(res, product, 'Product retrieved');
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const files = (req.files ?? []) as Express.Multer.File[];
  const newImageUrls = files.length > 0 ? await uploadProductImages(files) : undefined;

  const product = await ProductService.updateProduct(
    req.params.id,
    req.user.sub,
    req.body as UpdateProductInput,
    newImageUrls,
  );

  sendSuccess(res, product, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await ProductService.deleteProduct(req.params.id, req.user.sub);
  sendSuccess(res, null, 'Product deleted');
});

export const listMyProducts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const page  = Math.max(1, Number(req.query.page  ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const { data, total } = await ProductService.listVendorProducts(req.user.sub, { page, limit });
  sendPaginated(res, data, total, page, limit);
});

export const getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { data, total } = await ProductService.getStoreProducts(req.params.storeId, {
    page,
    limit,
  });
  sendPaginated(res, data, total, page, limit);
});
