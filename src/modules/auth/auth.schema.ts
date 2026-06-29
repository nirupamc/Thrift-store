import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address'),
      phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits starting with 6-9)'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
      role: z.enum([UserRole.BUYER, UserRole.VENDOR]).default(UserRole.BUYER),
      displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
    })
    .refine(
      (data) => data.role !== UserRole.VENDOR || Boolean(data.displayName),
      { message: 'displayName is required when registering as a vendor', path: ['displayName'] },
    ),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
