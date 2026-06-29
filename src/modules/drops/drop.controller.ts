import { Request, Response } from 'express';
import * as DropService from './drop.service';
import { CreateDropInput } from './drop.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { UnauthorizedError } from '../../utils/AppError';

export const createDrop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const drop = await DropService.createDrop(
    req.user.sub,
    req.params.storeId,
    req.body as CreateDropInput,
  );
  sendSuccess(res, drop, 'Drop scheduled successfully', 201);
});
