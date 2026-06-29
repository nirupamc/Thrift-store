import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';
import { CreateReviewInput } from './review.schema';

export async function createReview(userId: string, input: CreateReviewInput) {
  const buyer = await prisma.buyer.findUnique({ where: { userId } });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const existing = await prisma.review.findUnique({
    where: { buyerId_productId: { buyerId: buyer.id, productId: input.productId } },
  });
  if (existing) throw new ConflictError('You have already reviewed this product');

  // Eligibility: a SubOrder belonging to this buyer, status DELIVERED, containing the product
  const delivered = await prisma.subOrder.findFirst({
    where: {
      status: OrderStatus.DELIVERED,
      order:  { buyer: { userId } },
      items:  { some: { productId: input.productId } },
    },
  });
  if (!delivered) {
    throw new ForbiddenError('You can only review products from delivered orders');
  }

  const product = await prisma.product.findUnique({
    where:  { id: input.productId },
    select: { vendorId: true },
  });
  if (!product) throw new NotFoundError('Product');

  const review = await prisma.review.create({
    data: {
      buyerId:   buyer.id,
      productId: input.productId,
      rating:    input.rating,
      comment:   input.comment ?? null,
      images:    [],
    },
  });

  // Recalculate vendor aggregate rating asynchronously — non-blocking, non-fatal
  recalcVendorRating(product.vendorId).catch(() => {});

  return review;
}

async function recalcVendorRating(vendorId: string): Promise<void> {
  const stats = await prisma.review.aggregate({
    where:  { product: { vendorId } },
    _avg:   { rating: true },
    _count: { id: true },
  });
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      rating:      Math.round((stats._avg.rating ?? 0) * 10) / 10,
      ratingCount: stats._count.id,
    },
  });
}

export async function getProductReviews(
  productId: string,
  pagination: { page: number; limit: number },
) {
  const { page, limit } = pagination;
  const [data, total] = await prisma.$transaction([
    prisma.review.findMany({
      where:   { productId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: { buyer: { include: { user: { select: { email: true } } } } },
    }),
    prisma.review.count({ where: { productId } }),
  ]);
  return { data, total };
}

export async function getStoreReviews(
  storeId: string,
  pagination: { page: number; limit: number },
) {
  const { page, limit } = pagination;
  const [data, total] = await prisma.$transaction([
    prisma.review.findMany({
      where:   { product: { storeId } },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer:   { include: { user: { select: { email: true } } } },
        product: { select: { id: true, title: true, slug: true, images: true } },
      },
    }),
    prisma.review.count({ where: { product: { storeId } } }),
  ]);
  return { data, total };
}
