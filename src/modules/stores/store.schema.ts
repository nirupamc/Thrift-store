import { z } from 'zod';

const jsonOrArray = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);
const csvToArray  = (v: unknown) =>
  typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v;

const tryParseJson = (v: unknown) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};

const styleTagsField = z
  .preprocess(jsonOrArray, z.array(z.string().max(50)).max(10))
  .optional();

// ─── StoreTheme ───────────────────────────────────────────────────────────────

const stickerSchema = z.object({
  emoji: z.string().max(10),
  x:     z.number().min(0).max(100),
  y:     z.number().min(0).max(100),
  size:  z.number().min(12).max(80),
});

const storeThemeSchema = z.object({
  bannerType:              z.enum(['solid', 'gradient', 'image']).optional(),
  bannerColor1:            z.string().max(30).optional(),
  bannerColor2:            z.string().max(30).optional(),
  bannerGradientDirection: z.string().max(20).optional(),
  bannerImageUrl:          z.string().url().optional().nullable(),
  bgColor:                 z.string().max(30).optional(),
  bgPattern:               z.enum(['none','dots','stripes','checkerboard','zigzag','grid']).optional(),
  bgPatternOpacity:        z.number().min(0).max(100).optional(),
  stickers:                z.array(stickerSchema).max(20).optional(),
  marqueeText:             z.string().max(200).optional().nullable(),
  marqueeSpeed:            z.enum(['slow', 'medium', 'fast']).optional(),
  pageEffect:              z.enum(['none', 'sparkles', 'stars', 'confetti']).optional(),
  fontStyle:               z.enum(['retro', 'minimal', 'handwritten', 'bold', 'dreamy']).optional(),
  accentColor:             z.string().max(30).optional(),
  productLayout:           z.enum(['grid', 'list', 'magazine', 'polaroid']).optional(),
  borderStyle:             z.enum(['none', 'solid', 'dashed', 'double', 'retro']).optional(),
  borderColor:             z.string().max(30).optional(),
  showReviews:             z.boolean().optional(),
  showDrops:               z.boolean().optional(),
  showAbout:               z.boolean().optional(),
  // Font colors (applied to storefront headings/body)
  headingFontColor:        z.string().max(30).optional(),
  bodyFontColor:           z.string().max(30).optional(),
  // Product display overrides
  productNameFont:         z.string().max(100).optional(),
  productNameFontColor:    z.string().max(30).optional(),
  priceFont:               z.string().max(100).optional(),
  priceFontColor:          z.string().max(30).optional(),
  // Custom font
  customFontUrl:           z.string().url().optional().nullable(),
  customFontName:          z.string().max(100).optional().nullable(),
});

export type StoreThemeInput = z.infer<typeof storeThemeSchema>;

// ─── Create ───────────────────────────────────────────────────────────────────

export const createStoreSchema = z.object({
  body: z.object({
    storeName:  z.string().min(2, 'Store name must be at least 2 characters').max(100),
    bio:        z.string().max(500).optional(),
    city:       z.string().min(2, 'City is required').max(100),
    state:      z.string().max(100).optional(),
    styleTags:  styleTagsField,
  }),
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateStoreSchema = z.object({
  body: z
    .object({
      bio:          z.string().max(500).optional(),
      bannerColor:  z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'bannerColor must be a 6-digit hex string e.g. #FF5733')
        .optional(),
      dropSchedule: z.string().max(100).optional(),
      styleTags:    styleTagsField,
      storeTheme:   z.preprocess(tryParseJson, storeThemeSchema).optional(),
    })
    .refine((d) => Object.keys(d).length > 0 || true, {
      // body can be empty if only uploading an avatar — always pass
    }),
  params: z.object({ storeId: z.string().cuid('Invalid store ID') }),
});

// ─── List ─────────────────────────────────────────────────────────────────────

export const listStoresSchema = z.object({
  query: z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().max(100).optional(),
    city:   z.string().max(100).optional(),
    tags:   z.preprocess(csvToArray, z.array(z.string()).optional()).optional(),
  }),
});

// ─── Param-only ───────────────────────────────────────────────────────────────

export const storeIdSchema = z.object({
  params: z.object({ storeId: z.string().cuid('Invalid store ID') }),
});

// ─── Following (buyer) ────────────────────────────────────────────────────────

export const followingSchema = z.object({
  query: z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateStoreInput = z.infer<typeof createStoreSchema>['body'];
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>['body'];
export type ListStoresQuery  = z.infer<typeof listStoresSchema>['query'];
