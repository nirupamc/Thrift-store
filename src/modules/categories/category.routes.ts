import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
  sendSuccess(res, categories, 'Categories retrieved');
}));

export { router as categoryRouter };
