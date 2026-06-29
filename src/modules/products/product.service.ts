import { randomBytes } from 'crypto';
import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, ForbiddenError, NotFoundError, ConflictError } from '../../utils/AppError';
import { CreateProductInput, UpdateProductInput, ListProductsQuery } from './product.schema';

function nanoId(size = 8): string {
  // URL-safe random suffix — avoids the ESM-only nanoid package
  return randomBytes(Math.ceil((size * 3) / 4))
    .toString('base64url')
    .slice(0, size);
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60); // cap so slug stays readable
  return `${base}-${nanoId(8)}`;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProduct(
  userId: string,
  input: CreateProductInput,
  imageUrls: string[],
) {
  if (imageUrls.length === 0) {
    throw new AppError('At least one product image is required', 400, 'IMAGE_REQUIRED');
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { store: { select: { id: true } } },
  });

  if (!vendor) throw new NotFoundError('Vendor profile');
  if (!vendor.isApproved) throw new ForbiddenError('Your vendor account is pending approval');
  if (!vendor.store) {
    throw new AppError('Create a store before listing products', 400, 'NO_STORE');
  }

  const product = await prisma.product.create({
    data: {
      vendorId:     vendor.id,
      storeId:      vendor.store.id,
      categoryId:   input.categoryId,
      title:        input.title,
      slug:         slugify(input.title),
      description:  input.description,
      originalPrice: input.originalPrice ?? input.sellingPrice,
      sellingPrice: input.sellingPrice,
      condition:    input.condition,
      city:         input.city,
      status:       ProductStatus.ACTIVE,
      isAvailable:  true,

      // classification
      gender:  input.gender,
      rarity:  input.rarity,
      brand:   input.brand   ?? null,
      size:    input.size    ?? null,
      fabric:  input.fabric  ?? null,
      era:     input.era     ?? null,

      // arrays
      images: imageUrls,
      color:  input.color ?? [],
      style:  input.style ?? [],
      tags:   input.tags  ?? [],

      // condition honesty
      defects:      input.defects      ?? null,
      visibleSpots: input.visibleSpots ?? null,

      // structured extras
      measurements: (input.measurements as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      metadata:     (input.metadata     as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      store: { select: { id: true, name: true, slug: true } },
    },
  });

  return product;
}

// ─── List (paginated + filtered) ──────────────────────────────────────────────

export async function listProducts(query: ListProductsQuery) {
  const {
    page, limit, sortBy, sortOrder,
    // scalar filters
    categoryId, condition, priceMin, priceMax, city, search,
    brand, fabric, era, size, rarity, gender,
    // array filters
    color, style, tags,
  } = query;
  const skip = (page - 1) * limit;

  const priceFilter: Prisma.DecimalFilter | undefined =
    priceMin !== undefined || priceMax !== undefined
      ? {
          ...(priceMin !== undefined && { gte: priceMin }),
          ...(priceMax !== undefined && { lte: priceMax }),
        }
      : undefined;

  const where: Prisma.ProductWhereInput = {
    isAvailable: true,
    status:      ProductStatus.ACTIVE,

    // ── scalar exact/fuzzy ───────────────────────────────────────────────────
    ...(categoryId && { categoryId }),
    ...(condition  && { condition }),
    ...(rarity     && { rarity }),
    ...(gender     && { gender }),
    ...(city       && { city:    { contains: city,    mode: 'insensitive' } }),
    ...(search     && { title:   { contains: search,  mode: 'insensitive' } }),
    ...(brand      && { brand:   { contains: brand,   mode: 'insensitive' } }),
    ...(fabric     && { fabric:  { contains: fabric,  mode: 'insensitive' } }),
    ...(era        && { era:     { contains: era,     mode: 'insensitive' } }),
    ...(size       && { size:    { contains: size,    mode: 'insensitive' } }),
    ...(priceFilter && { sellingPrice: priceFilter }),

    // ── array containment (hasSome = OR across values) ───────────────────────
    ...(color?.length && { color: { hasSome: color } }),
    ...(style?.length && { style: { hasSome: style } }),
    ...(tags?.length  && { tags:  { hasSome: tags  } }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        slug: true,
        sellingPrice: true,
        condition: true,
        city: true,
        images: true,
        isAvailable: true,
        createdAt: true,
        // thrift discovery fields shown on listing cards
        brand: true,
        color: true,
        rarity: true,
        gender: true,
        era: true,
        style: true,
        tags: true,
        category: { select: { id: true, name: true, slug: true } },
        store:    { select: { id: true, name: true, slug: true } },
        vendor:   { select: { id: true, displayName: true, rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
}

// ─── Get one ──────────────────────────────────────────────────────────────────

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      store: { select: { id: true, name: true, slug: true, city: true, state: true } },
      vendor: {
        select: { id: true, displayName: true, avatar: true, rating: true, ratingCount: true },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          images: true,
          createdAt: true,
          buyer: { select: { user: { select: { email: true } } } },
        },
      },
    },
  });

  if (!product) throw new NotFoundError('Product');

  // fire-and-forget — never blocks the response
  prisma.product.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  return product;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProduct(
  productId: string,
  userId: string,
  input: UpdateProductInput,
  newImageUrls?: string[],
) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, vendorId: true, isAvailable: true },
  });

  if (!product) throw new NotFoundError('Product');
  if (product.vendorId !== vendor.id) throw new ForbiddenError('You do not own this product');
  if (!product.isAvailable) {
    throw new AppError('Sold products cannot be edited', 400, 'PRODUCT_SOLD');
  }

  const { categoryId, measurements, metadata, ...rest } = input;
  return prisma.product.update({
    where: { id: productId },
    data: {
      ...rest,
      ...(categoryId    && { category:     { connect: { id: categoryId } } }),
      ...(measurements !== undefined && { measurements: (measurements as Prisma.InputJsonValue) ?? Prisma.JsonNull }),
      ...(metadata     !== undefined && { metadata:     (metadata     as Prisma.InputJsonValue) ?? Prisma.JsonNull }),
      ...(newImageUrls && newImageUrls.length > 0 && { images: newImageUrls }),
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteProduct(productId: string, userId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, vendorId: true, isAvailable: true },
  });

  if (!product) throw new NotFoundError('Product');
  if (product.vendorId !== vendor.id) throw new ForbiddenError('You do not own this product');
  if (!product.isAvailable) {
    throw new AppError('Sold products cannot be deleted', 400, 'PRODUCT_SOLD');
  }

  await prisma.product.delete({ where: { id: productId } });
}

// ─── Store products ────────────────────────────────────────────────────────────

export async function getStoreProducts(
  storeId: string,
  pagination: { page: number; limit: number },
) {
  const { page, limit } = pagination;

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  if (!store) throw new NotFoundError('Store');

  const where: Prisma.ProductWhereInput = {
    storeId,
    isAvailable: true,
    status: ProductStatus.ACTIVE,
  };

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        sellingPrice: true,
        condition: true,
        city: true,
        images: true,
        isAvailable: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
}

// ─── Mark sold — called by orders module, never directly by a vendor ──────────
//
// SELECT FOR UPDATE locks the row for the transaction duration.
// Any concurrent checkout attempting the same product will block here
// and then see isAvailable = false once the first transaction commits.

export async function markProductSold(productId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; isAvailable: boolean }[]>`
      SELECT id, "isAvailable"
      FROM   products
      WHERE  id = ${productId}
      FOR UPDATE
    `;

    if (!rows[0]) throw new NotFoundError('Product');
    if (!rows[0].isAvailable) throw new ConflictError('Product is no longer available');

    await tx.product.update({
      where: { id: productId },
      data: { isAvailable: false, status: ProductStatus.SOLD },
    });
  });
}
