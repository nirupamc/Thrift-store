import {
  PaymentStatus,
  PayoutStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, NotFoundError } from '../../utils/AppError';
import type {
  AdminDropsQuery,
  AdminOrdersQuery,
  AdminPayoutsQuery,
  ListBuyersQuery,
  ListVendorsQuery,
} from './admin.schema';

// ─── Platform stats ───────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [
    revenueResult,
    totalOrders,
    totalVendors,
    totalBuyers,
    totalProducts,
    pendingPayoutsResult,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum:  { amount: true },
    }),
    prisma.order.count(),
    prisma.vendor.count(),
    prisma.buyer.count(),
    prisma.product.count(),
    prisma.payout.aggregate({
      where:  { status: PayoutStatus.PENDING },
      _sum:   { netAmount: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalRevenue:         Number(revenueResult._sum.amount ?? 0),
    totalOrders,
    totalVendors,
    totalBuyers,
    totalProducts,
    pendingPayoutsCount:  pendingPayoutsResult._count.id,
    pendingPayoutsAmount: Number(pendingPayoutsResult._sum.netAmount ?? 0),
  };
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

export async function listVendors(query: ListVendorsQuery) {
  const { page, limit, search, isApproved, isSuspended } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.VendorWhereInput = {
    ...(search && {
      OR: [
        { displayName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(isApproved  !== undefined && { isApproved }),
    ...(isSuspended !== undefined && { user: { isSuspended } }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.vendor.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, email: true, phone: true,
            isSuspended: true, createdAt: true,
          },
        },
        store: {
          select: {
            id: true, name: true, slug: true,
            isApproved: true, isActive: true,
          },
        },
        _count: { select: { products: true, subOrders: true } },
      },
    }),
    prisma.vendor.count({ where }),
  ]);

  return { data, total };
}

export async function approveVendor(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where:   { id: vendorId },
    include: { store: { select: { id: true } } },
  });
  if (!vendor) throw new NotFoundError('Vendor');
  if (!vendor.store) {
    throw new AppError('Vendor has no store yet', 400, 'NO_STORE');
  }

  // Approve both the vendor record and the store so public listing shows it
  return prisma.$transaction([
    prisma.vendor.update({ where: { id: vendorId }, data: { isApproved: true } }),
    prisma.store.update({ where: { id: vendor.store.id }, data: { isApproved: true } }),
  ]);
}

export async function suspendVendor(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where:  { id: vendorId },
    select: { userId: true },
  });
  if (!vendor) throw new NotFoundError('Vendor');

  return prisma.user.update({
    where:  { id: vendor.userId },
    data:   { isSuspended: true },
    select: { id: true, email: true, isSuspended: true },
  });
}

// ─── Buyers ───────────────────────────────────────────────────────────────────

export async function listBuyers(query: ListBuyersQuery) {
  const { page, limit, search, isSuspended } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BuyerWhereInput = {
    ...(search      && { user: { email: { contains: search, mode: 'insensitive' } } }),
    ...(isSuspended !== undefined && { user: { isSuspended } }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.buyer.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, email: true, phone: true,
            isSuspended: true, isVerified: true, createdAt: true,
          },
        },
        _count: { select: { orders: true, reviews: true, followedStores: true } },
      },
    }),
    prisma.buyer.count({ where }),
  ]);

  return { data, total };
}

export async function suspendBuyer(buyerId: string) {
  const buyer = await prisma.buyer.findUnique({
    where:  { id: buyerId },
    select: { userId: true },
  });
  if (!buyer) throw new NotFoundError('Buyer');

  return prisma.user.update({
    where:  { id: buyer.userId },
    data:   { isSuspended: true },
    select: { id: true, email: true, isSuspended: true },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function listOrders(query: AdminOrdersQuery) {
  const { page, limit, status, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo   && { lte: new Date(dateTo)   }),
      },
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          include: { user: { select: { email: true, phone: true } } },
        },
        payment: { select: { status: true, amount: true, razorpayOrderId: true } },
        _count:  { select: { subOrders: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total };
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export async function listPayouts(query: AdminPayoutsQuery) {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PayoutWhereInput = {
    ...(status && { status }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.payout.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor:   { select: { displayName: true, user: { select: { email: true } } } },
        subOrder: { select: { id: true, orderId: true, subtotal: true } },
      },
    }),
    prisma.payout.count({ where }),
  ]);

  return { data, total };
}

export async function markPayoutPaid(payoutId: string) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new NotFoundError('Payout');
  if (payout.status === PayoutStatus.PAID) {
    throw new AppError('Payout has already been marked as paid', 409, 'ALREADY_PAID');
  }

  return prisma.payout.update({
    where: { id: payoutId },
    data:  { status: PayoutStatus.PAID, processedAt: new Date() },
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function adminDeleteProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where:   { id: productId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) throw new NotFoundError('Product');

  if (product._count.orderItems > 0) {
    // The product is referenced in order history — soft-delete to preserve records
    return prisma.product.update({
      where: { id: productId },
      data:  { status: ProductStatus.INACTIVE, isAvailable: false },
    });
  }

  // No order history — cascade-delete all orphan relations then hard-delete
  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: { productId } }),
    prisma.review.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);
  return null;
}

// ─── Drops ────────────────────────────────────────────────────────────────────

export async function listDrops(query: AdminDropsQuery) {
  const { page, limit, storeId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.DropWhereInput = {
    ...(storeId && { storeId }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.drop.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { scheduledAt: 'desc' },
      include: {
        store:  { select: { name: true, slug: true, city: true } },
        vendor: { select: { displayName: true } },
      },
    }),
    prisma.drop.count({ where }),
  ]);

  return { data, total };
}
