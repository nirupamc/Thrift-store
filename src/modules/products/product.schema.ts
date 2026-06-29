import { z } from 'zod';
import { ProductCondition, ProductStatus, Rarity, Gender } from '@prisma/client';

// Vendor-accessible status transitions — SOLD is system-only
const updatableStatuses = [ProductStatus.DRAFT, ProductStatus.ACTIVE, ProductStatus.INACTIVE] as const;

// ── Reusable field preprocess helpers ─────────────────────────────────────────

/** Comma-separated query param → string[]. Used for array filters on GET /products. */
const csvToArray = (v: unknown) =>
  typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v;

/** JSON string or pass-through array. Used for body fields in multipart forms. */
const jsonOrArray = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);

/** JSON string or pass-through object. Used for measurements/metadata in multipart forms. */
const jsonOrObject = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);

// ── Shared array field schemas ─────────────────────────────────────────────────

const colorField = z
  .preprocess(jsonOrArray, z.array(z.string().max(50)).max(6))
  .optional();

const styleField = z
  .preprocess(jsonOrArray, z.array(z.string().max(50)).max(10))
  .optional();

const tagsField = z
  .preprocess(jsonOrArray, z.array(z.string().max(30)).max(15))
  .optional();

const measurementsField = z
  .preprocess(jsonOrObject, z.record(z.string(), z.string()).nullable())
  .optional();

const metadataField = z
  .preprocess(jsonOrObject, z.record(z.string(), z.unknown()).nullable())
  .optional();

// ─── Create ───────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  body: z.object({
    // ── Core ─────────────────────────────────────────────────────────────────
    title:        z.string().min(3, 'Title must be at least 3 characters').max(200),
    description:  z.string().min(10, 'Description must be at least 10 characters').max(2000),
    sellingPrice: z.coerce.number().positive('Selling price must be positive'),
    originalPrice: z.coerce.number().positive().optional(),
    condition:    z.nativeEnum(ProductCondition),
    categoryId:   z.string().cuid('Invalid category ID'),
    city:         z.string().min(2).max(100),

    // ── Classification (required) ─────────────────────────────────────────────
    gender: z.nativeEnum(Gender),

    // ── Classification (optional) ─────────────────────────────────────────────
    rarity:  z.nativeEnum(Rarity).default(Rarity.COMMON),
    brand:   z.string().max(100).optional(),
    size:    z.string().max(50).optional(),
    fabric:  z.string().max(100).optional(),
    era:     z.string().max(50).optional(),

    // ── Array fields ──────────────────────────────────────────────────────────
    color: colorField,
    style: styleField,
    tags:  tagsField,

    // ── Condition honesty ──────────────────────────────────────────────────────
    defects:      z.string().max(500).optional(),
    visibleSpots: z.string().max(500).optional(),

    // ── Structured extras ─────────────────────────────────────────────────────
    measurements: measurementsField,
    metadata:     metadataField,
  }),
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateProductSchema = z.object({
  body: z
    .object({
      title:         z.string().min(3).max(200).optional(),
      description:   z.string().min(10).max(2000).optional(),
      sellingPrice:  z.coerce.number().positive().optional(),
      originalPrice: z.coerce.number().positive().optional(),
      condition:     z.nativeEnum(ProductCondition).optional(),
      categoryId:    z.string().cuid().optional(),
      city:          z.string().min(2).max(100).optional(),
      gender:        z.nativeEnum(Gender).optional(),
      rarity:        z.nativeEnum(Rarity).optional(),
      brand:         z.string().max(100).optional(),
      size:          z.string().max(50).optional(),
      fabric:        z.string().max(100).optional(),
      era:           z.string().max(50).optional(),
      color:         colorField,
      style:         styleField,
      tags:          tagsField,
      defects:       z.string().max(500).optional(),
      visibleSpots:  z.string().max(500).optional(),
      measurements:  measurementsField,
      metadata:      metadataField,
      status:        z.enum(updatableStatuses).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' }),
  params: z.object({ id: z.string().cuid('Invalid product ID') }),
});

// ─── List / filter ────────────────────────────────────────────────────────────

export const listProductsSchema = z.object({
  query: z.object({
    // ── Pagination ────────────────────────────────────────────────────────────
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),

    // ── Sort ──────────────────────────────────────────────────────────────────
    sortBy:    z.enum(['createdAt', 'sellingPrice', 'views']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),

    // ── Scalar filters ────────────────────────────────────────────────────────
    categoryId: z.string().optional(),
    condition:  z.nativeEnum(ProductCondition).optional(),
    priceMin:   z.coerce.number().positive().optional(),
    priceMax:   z.coerce.number().positive().optional(),
    city:       z.string().optional(),
    search:     z.string().max(100).optional(),
    brand:      z.string().max(100).optional(),
    fabric:     z.string().max(100).optional(),
    era:        z.string().max(50).optional(),
    size:       z.string().max(50).optional(),
    rarity:     z.nativeEnum(Rarity).optional(),
    gender:     z.nativeEnum(Gender).optional(),

    // ── Array filters (comma-separated, e.g. ?color=black,white) ─────────────
    color: z.preprocess(csvToArray, z.array(z.string()).optional()).optional(),
    style: z.preprocess(csvToArray, z.array(z.string()).optional()).optional(),
    tags:  z.preprocess(csvToArray, z.array(z.string()).optional()).optional(),
  }),
});

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const productIdSchema = z.object({
  params: z.object({ id: z.string().cuid('Invalid product ID') }),
});

export const storeProductsSchema = z.object({
  params: z.object({ storeId: z.string().cuid('Invalid store ID') }),
  query: z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery  = z.infer<typeof listProductsSchema>['query'];
