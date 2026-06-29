import { Request, Response } from 'express';
import * as ReviewService from './review.service';
import { CreateReviewInput } from './review.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { UnauthorizedError } from '../../utils/AppError';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const review = await ReviewService.createReview(req.user.sub, req.body as CreateReviewInput);
  sendSuccess(res, review, 'Review submitted successfully', 201);
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const page  = Number(req.query.page  ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { data, total } = await ReviewService.getProductReviews(
    req.params.productId,
    { page, limit },
  );
  sendPaginated(res, data, total, page, limit);
});

export const getStoreReviews = asyncHandler(async (req: Request, res: Response) => {
  const page  = Number(req.query.page  ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { data, total } = await ReviewService.getStoreReviews(
    req.params.storeId,
    { page, limit },
  );
  sendPaginated(res, data, total, page, limit);
});
