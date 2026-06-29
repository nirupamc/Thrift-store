import { z } from 'zod';

export const createDropSchema = z.object({
  body: z.object({
    dropTitle:   z.string().min(2, 'Drop title must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
    scheduledAt: z.string().datetime({ message: 'scheduledAt must be an ISO 8601 datetime string' }),
    productIds:  z
      .array(z.string().cuid('Invalid product ID'))
      .min(1, 'At least one product is required')
      .max(20, 'Cannot feature more than 20 products per drop'),
  }),
  params: z.object({ storeId: z.string().cuid('Invalid store ID') }),
});

export type CreateDropInput = z.infer<typeof createDropSchema>['body'];
