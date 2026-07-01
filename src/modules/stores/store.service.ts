import { randomBytes } from 'crypto';
import { Prisma, ProductStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';
import { CreateStoreInput, UpdateStoreInput, ListStoresQuery } from './store.schema';

// ─── Slug ─────────────────────────────────────────────────────────────────────

function nanoId(size = 8): string {
  return randomBytes(Math.ceil((size * 3) / 4))
    .toString('base64url')
    .slice(0, size);
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  return `${base}-${nanoId(8)}`;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createStore(userId: string, input: CreateStoreInput) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { store: { select: { id: true } } },
  });

  if (!vendor) throw new NotFoundError('Vendor profile');
  if (vendor.store) throw new ConflictError('You already have a store');

  return prisma.store.create({
    data: {
      vendorId:    vendor.id,
      name:        input.storeName,
      slug:        slugify(input.storeName),
      description: input.bio ?? null,
      city:        input.city,
      state:       input.state ?? null,
      styleTags:   input.styleTags ?? [],
    },
    select: {
      id: true, name: true, slug: true, description: true,
      city: true, state: true, styleTags: true,
      logo: true, bannerColor: true, dropSchedule: true,
      createdAt: true,
      vendor: { select: { id: true, displayName: true } },
    },
  });
}

// ─── List (paginated + filtered) ──────────────────────────────────────────────

export async function listStores(query: ListStoresQuery) {
  const { page, limit, search, city, tags } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StoreWhereInput = {
    isActive:   true,
    isApproved: true,   // unapproved stores are not visible to the public
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(tags?.length && { styleTags: { hasSome: tags } }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, slug: true, description: true,
        logo: true, banner: true, city: true, state: true,
        styleTags: true, bannerColor: true, dropSchedule: true,
        storeTheme: true,
        createdAt: true,
        vendor: {
          select: {
            displayName: true, rating: true,
            ratingCount: true, totalSales: true,
          },
        },
        _count: { select: { products: true, followers: true } },
      },
    }),
    prisma.store.count({ where }),
  ]);

  return { data, total };
}

// ─── Get store profile ────────────────────────────────────────────────────────

export async function getStore(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      vendor: {
        select: {
          id: true, displayName: true, avatar: true, bio: true,
          rating: true, ratingCount: true, totalSales: true,
        },
      },
      // Latest 8 active, available products
      products: {
        where: { isAvailable: true, status: ProductStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true, title: true, slug: true,
          sellingPrice: true, condition: true,
          images: true, rarity: true, gender: true,
          brand: true, color: true, era: true, createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      _count: { select: { followers: true } },
    },
  });

  if (!store) throw new NotFoundError('Store');
  return store;
}

// ─── Get own store (vendor) ───────────────────────────────────────────────────

export async function getMyStore(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { store: { select: { id: true } } },
  });
  if (!vendor) throw new NotFoundError('Vendor profile');
  if (!vendor.store) return null;
  return getStore(vendor.store.id);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateStore(
  storeId: string,
  userId: string,
  input: UpdateStoreInput,
  avatarUrl?: string,
  bannerImageUrl?: string,
) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, vendorId: true },
  });

  if (!store) throw new NotFoundError('Store');
  if (store.vendorId !== vendor.id) throw new ForbiddenError('You do not own this store');

  const hasChanges = Object.keys(input).length > 0 || avatarUrl !== undefined || bannerImageUrl !== undefined;
  if (!hasChanges) {
    throw new AppError('No changes provided', 400, 'NO_CHANGES');
  }

  // Merge bannerImageUrl into storeTheme if an image was uploaded
  const mergedTheme: Record<string, unknown> | undefined =
    bannerImageUrl
      ? { ...(input.storeTheme ?? {}), bannerImageUrl }
      : input.storeTheme ?? undefined;

  return prisma.store.update({
    where: { id: storeId },
    data: {
      ...(input.bio          !== undefined && { description:  input.bio }),
      ...(input.bannerColor  !== undefined && { bannerColor:  input.bannerColor }),
      ...(input.dropSchedule !== undefined && { dropSchedule: input.dropSchedule }),
      ...(input.styleTags    !== undefined && { styleTags:    input.styleTags }),
      ...(avatarUrl                        && { logo:          avatarUrl }),
      ...(mergedTheme        !== undefined && { storeTheme:   mergedTheme as Prisma.InputJsonValue }),
    },
  });
}

// ─── Stats (vendor-private dashboard) ────────────────────────────────────────

export async function getStoreStats(storeId: string, userId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, vendorId: true },
  });

  if (!store) throw new NotFoundError('Store');
  if (store.vendorId !== vendor.id) throw new ForbiddenError('You do not own this store');

  const [revenueResult, totalItemsSold, ratingResult, totalFollowers] = await Promise.all([
    // Revenue = sum of subtotals on subOrders linked to paid orders
    prisma.subOrder.aggregate({
      where: {
        vendorId: vendor.id,
        order: { payment: { status: PaymentStatus.PAID } },
      },
      _sum: { subtotal: true },
    }),

    // Items sold = products with SOLD status
    prisma.product.count({
      where: { vendorId: vendor.id, status: ProductStatus.SOLD },
    }),

    // Rating = avg + count across all reviews on this vendor's products
    prisma.review.aggregate({
      where: { product: { vendorId: vendor.id } },
      _avg:   { rating: true },
      _count: { id: true },
    }),

    // Followers = store follow records
    prisma.storeFollower.count({ where: { storeId } }),
  ]);

  return {
    totalRevenue:   Number(revenueResult._sum.subtotal ?? 0),
    totalItemsSold,
    averageRating:  Math.round((ratingResult._avg.rating ?? 0) * 10) / 10,
    totalReviews:   ratingResult._count.id,
    totalFollowers,
  };
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export async function followStore(userId: string, storeId: string) {
  const buyer = await prisma.buyer.findUnique({ where: { userId } });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const store = await prisma.store.findUnique({
    where:  { id: storeId },
    select: { id: true, isActive: true },
  });
  if (!store || !store.isActive) throw new NotFoundError('Store');

  try {
    return await prisma.storeFollower.create({
      data: { storeId, buyerId: buyer.id },
    });
  } catch {
    // Prisma P2002 unique constraint — already following
    throw new ConflictError('You are already following this store');
  }
}

export async function unfollowStore(userId: string, storeId: string) {
  const buyer = await prisma.buyer.findUnique({ where: { userId }, select: { id: true } });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const record = await prisma.storeFollower.findUnique({
    where: { storeId_buyerId: { storeId, buyerId: buyer.id } },
  });
  if (!record) throw new NotFoundError('You are not following this store');

  await prisma.storeFollower.delete({
    where: { storeId_buyerId: { storeId, buyerId: buyer.id } },
  });
}

// ─── Save banner image URL ────────────────────────────────────────────────────

export async function saveBannerImage(storeId: string, userId: string, imageUrl: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, vendorId: true, storeTheme: true },
  });
  if (!store) throw new NotFoundError('Store');
  if (store.vendorId !== vendor.id) throw new ForbiddenError('You do not own this store');

  const existingTheme = (store.storeTheme as Record<string, unknown>) ?? {};
  return prisma.store.update({
    where: { id: storeId },
    data: {
      banner: imageUrl,
      storeTheme: {
        ...existingTheme,
        bannerImageUrl: imageUrl,
        bannerType: 'image',
      } as Prisma.InputJsonValue,
    },
  });
}

// ─── Upload custom font ───────────────────────────────────────────────────────

export async function uploadStoreFont(storeId: string, userId: string, fontUrl: string, fontName: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, vendorId: true, storeTheme: true },
  });
  if (!store) throw new NotFoundError('Store');
  if (store.vendorId !== vendor.id) throw new ForbiddenError('You do not own this store');

  const existingTheme = (store.storeTheme as Record<string, unknown>) ?? {};
  return prisma.store.update({
    where: { id: storeId },
    data: {
      storeTheme: {
        ...existingTheme,
        customFontUrl: fontUrl,
        customFontName: fontName,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function getFollowedStores(
  userId: string,
  pagination: { page: number; limit: number },
) {
  const buyer = await prisma.buyer.findUnique({ where: { userId }, select: { id: true } });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const { page, limit } = pagination;

  const [data, total] = await prisma.$transaction([
    prisma.storeFollower.findMany({
      where:   { buyerId: buyer.id },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: {
            id: true, name: true, slug: true, logo: true,
            city: true, styleTags: true, bannerColor: true,
            vendor: { select: { displayName: true, rating: true } },
          },
        },
      },
    }),
    prisma.storeFollower.count({ where: { buyerId: buyer.id } }),
  ]);

  return { data, total };
}

