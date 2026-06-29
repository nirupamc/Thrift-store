import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().cuid('Invalid product ID'),
    rating:    z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment:   z.string().max(1000).optional(),
  }),
});

export const listReviewsByProductSchema = z.object({
  params: z.object({ productId: z.string().cuid('Invalid product ID') }),
  query:  z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const listReviewsByStoreSchema = z.object({
  params: z.object({ storeId: z.string().cuid('Invalid store ID') }),
  query:  z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
