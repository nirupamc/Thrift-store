import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as StoreService from './store.service';
import { CreateStoreInput, UpdateStoreInput, ListStoresQuery } from './store.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { uploadAvatar } from '../../config/cloudinary';
import { AppError, UnauthorizedError } from '../../utils/AppError';
import { uploadStoreImages } from '../../middleware/upload';

// Wraps multer fields-upload so its errors flow through errorHandler.
// Accepts avatarImage and/or bannerImage in a single multipart request.
// For JSON-only requests (no file), multer passes through without touching the body.
export function handleAvatarUpload(req: Request, res: Response, next: NextFunction): void {
  uploadStoreImages(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Image must be under 5 MB', 400, 'FILE_TOO_LARGE'));
    }
    next(err);
  });
}

export const createStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const store = await StoreService.createStore(req.user.sub, req.body as CreateStoreInput);
  sendSuccess(res, store, 'Store created successfully', StatusCodes.CREATED);
});

export const listStores = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListStoresQuery;
  const { data, total } = await StoreService.listStores(query);
  sendPaginated(res, data, total, query.page, query.limit);
});

export const getStore = asyncHandler(async (req: Request, res: Response) => {
  const store = await StoreService.getStore(req.params.storeId);
  sendSuccess(res, store, 'Store retrieved');
});

export const getMyStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const store = await StoreService.getMyStore(req.user.sub);
  sendSuccess(res, store, 'Store retrieved');
});

export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const avatarFile  = files?.['avatarImage']?.[0];
  const bannerFile  = files?.['bannerImage']?.[0];

  const [avatarUrl, bannerImageUrl] = await Promise.all([
    avatarFile  ? uploadAvatar(avatarFile)  : Promise.resolve(undefined),
    bannerFile  ? uploadAvatar(bannerFile)  : Promise.resolve(undefined),
  ]);

  const store = await StoreService.updateStore(
    req.params.storeId,
    req.user.sub,
    req.body as UpdateStoreInput,
    avatarUrl,
    bannerImageUrl,
  );
  sendSuccess(res, store, 'Store updated');
});

export const getStoreStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const stats = await StoreService.getStoreStats(req.params.storeId, req.user.sub);
  sendSuccess(res, stats, 'Store stats retrieved');
});

// ── Follow / Unfollow ─────────────────────────────────────────────────────────

export const followStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await StoreService.followStore(req.user.sub, req.params.storeId);
  sendSuccess(res, result, 'Store followed', StatusCodes.CREATED);
});

export const unfollowStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await StoreService.unfollowStore(req.user.sub, req.params.storeId);
  sendSuccess(res, null, 'Unfollowed successfully');
});

export const getFollowedStores = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const page  = Number(req.query.page  ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { data, total } = await StoreService.getFollowedStores(req.user.sub, { page, limit });
  sendPaginated(res, data, total, page, limit);
});
