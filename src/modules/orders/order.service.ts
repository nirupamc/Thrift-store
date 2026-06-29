import crypto from 'crypto';
import { OrderStatus, PaymentStatus, PayoutStatus, Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { razorpay } from '../../config/razorpay';
import { env } from '../../config/env';
import { markProductSold } from '../products/product.service';
import { getRawCart, clearCart, CartItem } from '../cart/cart.service';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/AppError';
import { CheckoutInput, VerifyPaymentInput } from './order.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface VendorGroup {
  vendorId:   string;
  vendorName: string;
  storeId:    string;
  storeName:  string;
  items:      CartItem[];
  subtotal:   number;
}

function groupByVendor(items: CartItem[]): VendorGroup[] {
  const map = new Map<string, VendorGroup>();
  for (const item of items) {
    if (!map.has(item.vendorId)) {
      map.set(item.vendorId, {
        vendorId:   item.vendorId,
        vendorName: item.vendorName,
        storeId:    item.storeId,
        storeName:  item.storeName,
        items:      [],
        subtotal:   0,
      });
    }
    const g = map.get(item.vendorId)!;
    g.items.push(item);
    g.subtotal = Math.round((g.subtotal + item.sellingPrice) * 100) / 100;
  }
  return Array.from(map.values());
}

// ─── Checkout ──────────────────────────────────────────────────────────────────

export async function checkout(userId: string, input: CheckoutInput) {
  const buyer = await prisma.buyer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const cartItems = await getRawCart(userId);
  if (cartItems.length === 0) {
    throw new AppError('Your cart is empty', 400, 'EMPTY_CART');
  }

  const productIds = cartItems.map((i) => i.productId);

  // Create Order + SubOrders + OrderItems + Payment shell in one transaction.
  // Products are soft-checked here; the hard SELECT FOR UPDATE lock happens at
  // verify-payment time when the user's money is confirmed.
  //
  // TODO: add a cleanup job or cron to expire stale PENDING orders after 30 min.
  const order = await prisma.$transaction(async (tx) => {
    const available = await tx.product.findMany({
      where: { id: { in: productIds }, isAvailable: true, status: ProductStatus.ACTIVE },
      select: { id: true },
    });

    if (available.length !== productIds.length) {
      const availSet    = new Set(available.map((p) => p.id));
      const unavailable = productIds.filter((id) => !availSet.has(id));
      throw new ConflictError(
        `These products are no longer available: ${unavailable.join(', ')}`,
      );
    }

    const groups      = groupByVendor(cartItems);
    const totalAmount = cartItems.reduce((s, i) => Math.round((s + i.sellingPrice) * 100) / 100, 0);

    return tx.order.create({
      data: {
        buyerId:          buyer.id,
        status:           OrderStatus.PENDING,
        totalAmount,
        finalAmount:      totalAmount,
        shippingSnapshot: input.shippingAddress as Prisma.InputJsonValue,
        notes:            input.notes,

        subOrders: {
          create: groups.map((g) => ({
            vendorId: g.vendorId,
            status:   OrderStatus.PENDING,
            subtotal: g.subtotal,

            items: {
              create: g.items.map((item) => ({
                productId:  item.productId,
                quantity:   1,
                unitPrice:  item.sellingPrice,
                totalPrice: item.sellingPrice,
                snapshot: {
                  title:      item.title,
                  image:      item.images[0] ?? null,
                  condition:  item.condition,
                  brand:      item.brand,
                  vendorName: item.vendorName,
                  storeName:  item.storeName,
                } as Prisma.InputJsonValue,
              })),
            },
          })),
        },

        payment: {
          create: {
            amount:   totalAmount,
            currency: 'INR',
            status:   PaymentStatus.PENDING,
          },
        },
      },
      select: {
        id:          true,
        totalAmount: true,
        subOrders:   { select: { id: true } },
      },
    });
  });

  // Create Razorpay order outside the Prisma transaction — if this fails,
  // the Order stays PENDING and can be retried. The stale PENDING cleanup TODO above applies.
  const amountPaise = Math.round(Number(order.totalAmount) * 100);

  const rzpOrder = await razorpay.orders.create({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  order.id,
    notes:    { orderId: order.id, buyerId: buyer.id },
  });

  await prisma.payment.update({
    where:  { orderId: order.id },
    data:   { razorpayOrderId: rzpOrder.id },
  });

  return {
    order: {
      id:            order.id,
      totalAmount:   Number(order.totalAmount),
      itemCount:     cartItems.length,
      subOrderCount: order.subOrders.length,
    },
    payment: {
      razorpayOrderId: rzpOrder.id,
      amount:          amountPaise,
      currency:        'INR',
      keyId:           env.RAZORPAY_KEY_ID,
    },
  };
}

// ─── Verify payment ────────────────────────────────────────────────────────────

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

  // 1. Validate HMAC-SHA256 signature
  //    Body = razorpay_order_id + "|" + razorpay_payment_id
  //    Secret = key_secret (not webhook secret)
  const expectedSig = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    throw new UnauthorizedError('Payment signature verification failed');
  }

  // 2. Fetch Payment → Order → SubOrders
  const payment = await prisma.payment.findUnique({
    where:   { razorpayOrderId },
    include: {
      order: {
        include: {
          buyer:     { select: { userId: true } },
          subOrders: { select: { id: true, vendorId: true, subtotal: true } },
        },
      },
    },
  });

  if (!payment)                               throw new NotFoundError('Payment record');
  if (payment.order.buyer.userId !== userId)  throw new ForbiddenError('Order does not belong to you');
  if (payment.status === PaymentStatus.PAID)  throw new ConflictError('Payment already processed');

  // 3. Collect all productIds in this order
  const orderItems = await prisma.orderItem.findMany({
    where:  { subOrder: { orderId: payment.order.id } },
    select: { productId: true },
  });
  const productIds = orderItems.map((oi) => oi.productId);

  // 4. Mark every product sold using SELECT FOR UPDATE — run in parallel.
  //    Each call opens its own Prisma transaction with a row-level lock.
  //    Concurrent checkouts attempting the same product will block on the lock,
  //    then fail with ConflictError('Product is no longer available').
  const soldResults = await Promise.allSettled(
    productIds.map((id) => markProductSold(id)),
  );

  const failures = soldResults.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    // TODO: Refund logic
    // One or more products were sold by a concurrent checkout between this
    // buyer's checkout and verify calls.
    // Production fix: call razorpay.payments.refund(razorpayPaymentId, { amount: ... })
    // for the full order amount, then cancel the order below.
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data:  { razorpayPaymentId, razorpaySignature, status: PaymentStatus.REFUNDED },
      }),
      prisma.order.update({
        where: { id: payment.order.id },
        data:  { status: OrderStatus.CANCELLED },
      }),
    ]);
    throw new ConflictError(
      'One or more items were sold during checkout. Your payment will be refunded.',
    );
  }

  // 5. Atomically: confirm payment + order + sub-orders + create vendor payouts
  const feeRate = env.PLATFORM_FEE_PERCENT / 100;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { razorpayPaymentId, razorpaySignature, status: PaymentStatus.PAID },
    }),
    prisma.order.update({
      where: { id: payment.order.id },
      data:  { status: OrderStatus.CONFIRMED },
    }),
    prisma.subOrder.updateMany({
      where: { orderId: payment.order.id },
      data:  { status: OrderStatus.CONFIRMED },
    }),
    prisma.payout.createMany({
      data: payment.order.subOrders.map((sub) => {
        const gross = Math.round(Number(sub.subtotal) * 100) / 100;
        const fee   = Math.round(gross * feeRate * 100) / 100;
        return {
          vendorId:    sub.vendorId,
          subOrderId:  sub.id,
          grossAmount: gross,
          platformFee: fee,
          netAmount:   Math.round((gross - fee) * 100) / 100,
          status:      PayoutStatus.PENDING,
        };
      }),
    }),
  ]);

  // 6. Clear buyer's cart
  await clearCart(userId);

  return { orderId: payment.order.id };
}

// ─── Buyer: order history ──────────────────────────────────────────────────────

export async function getBuyerOrders(
  userId: string,
  pagination: { page: number; limit: number },
) {
  const buyer = await prisma.buyer.findUnique({ where: { userId }, select: { id: true } });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const { page, limit } = pagination;

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where:   { buyerId: buyer.id },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:          true,
        status:      true,
        totalAmount: true,
        finalAmount: true,
        createdAt:   true,
        payment:     { select: { status: true, method: true } },
        subOrders: {
          select: {
            id:       true,
            status:   true,
            subtotal: true,
            vendor:   { select: { displayName: true } },
            _count:   { select: { items: true } },
          },
        },
      },
    }),
    prisma.order.count({ where: { buyerId: buyer.id } }),
  ]);

  return { data, total };
}

// ─── Buyer: single order ───────────────────────────────────────────────────────

export async function getBuyerOrder(userId: string, orderId: string) {
  const buyer = await prisma.buyer.findUnique({ where: { userId }, select: { id: true } });
  if (!buyer) throw new NotFoundError('Buyer profile');

  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: {
      subOrders: {
        include: {
          vendor: { select: { displayName: true, avatar: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, images: true } },
            },
          },
          payout: { select: { status: true, netAmount: true } },
        },
      },
      payment: true,
    },
  });

  if (!order)                    throw new NotFoundError('Order');
  if (order.buyerId !== buyer.id) throw new ForbiddenError('Order does not belong to you');

  return order;
}

// ─── Vendor: sub-order list ────────────────────────────────────────────────────

export async function getVendorOrders(
  userId: string,
  pagination: { page: number; limit: number },
) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const { page, limit } = pagination;

  const [data, total] = await prisma.$transaction([
    prisma.subOrder.findMany({
      where:   { vendorId: vendor.id },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id:              true,
            createdAt:       true,
            shippingSnapshot: true,
            buyer: { select: { user: { select: { email: true, phone: true } } } },
          },
        },
        items: {
          select: {
            id:        true,
            quantity:  true,
            unitPrice: true,
            snapshot:  true,
            product:   { select: { id: true, title: true, images: true } },
          },
        },
        payout: {
          select: { status: true, netAmount: true, grossAmount: true, platformFee: true },
        },
      },
    }),
    prisma.subOrder.count({ where: { vendorId: vendor.id } }),
  ]);

  return { data, total };
}

// ─── Vendor: advance sub-order status ─────────────────────────────────────────

// Valid transitions: CONFIRMED → SHIPPED → DELIVERED
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.CONFIRMED]: OrderStatus.SHIPPED,
  [OrderStatus.SHIPPED]:   OrderStatus.DELIVERED,
};

export async function updateSubOrderStatus(
  userId:      string,
  subOrderId:  string,
  newStatus:   OrderStatus,
) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const sub = await prisma.subOrder.findUnique({
    where:  { id: subOrderId },
    select: { id: true, vendorId: true, status: true },
  });

  if (!sub)                        throw new NotFoundError('SubOrder');
  if (sub.vendorId !== vendor.id)  throw new ForbiddenError('You do not own this sub-order');

  const allowed = NEXT_STATUS[sub.status];
  if (allowed !== newStatus) {
    throw new AppError(
      `Cannot transition from ${sub.status} to ${newStatus}. Expected: ${allowed ?? 'no further transitions'}`,
      400,
      'INVALID_STATUS_TRANSITION',
    );
  }

  return prisma.subOrder.update({
    where: { id: subOrderId },
    data:  { status: newStatus },
  });
}
