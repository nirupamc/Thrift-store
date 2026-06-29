import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().cuid('Invalid product ID'),
  }),
});

export const removeFromCartSchema = z.object({
  params: z.object({
    productId: z.string().cuid('Invalid product ID'),
  }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
