import { ProductStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { AppError, ConflictError, NotFoundError } from '../../utils/AppError';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId:    string;
  vendorId:     string;
  vendorName:   string;
  storeId:      string;
  storeName:    string;
  title:        string;
  sellingPrice: number;
  images:       string[];
  condition:    string;
  brand:        string | null;
  addedAt:      string;
}

export interface CartGroup {
  vendorId:   string;
  vendorName: string;
  storeId:    string;
  storeName:  string;
  items:      CartItem[];
  subtotal:   number;
}

// ─── Redis helpers ────────────────────────────────────────────────────────────

const CART_TTL   = 30 * 24 * 60 * 60; // 30 days inactivity expiry
const cartKey    = (userId: string) => `tb:cart:${userId}`;

// ─── Add ──────────────────────────────────────────────────────────────────────

export async function addToCart(userId: string, productId: string): Promise<CartItem> {
  const key = cartKey(userId);

  const existing = await redis.hget(key, productId);
  if (existing) throw new ConflictError('Product is already in your cart');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id:           true,
      title:        true,
      sellingPrice: true,
      images:       true,
      condition:    true,
      brand:        true,
      isAvailable:  true,
      status:       true,
      vendorId:     true,
      storeId:      true,
      vendor: { select: { displayName: true } },
      store:  { select: { name: true } },
    },
  });

  if (!product) throw new NotFoundError('Product');
  if (!product.isAvailable || product.status !== ProductStatus.ACTIVE) {
    throw new AppError('This product is no longer available', 409, 'PRODUCT_UNAVAILABLE');
  }

  const item: CartItem = {
    productId:    product.id,
    vendorId:     product.vendorId,
    vendorName:   product.vendor.displayName,
    storeId:      product.storeId,
    storeName:    product.store.name,
    title:        product.title,
    sellingPrice: Number(product.sellingPrice),
    images:       product.images,
    condition:    product.condition,
    brand:        product.brand,
    addedAt:      new Date().toISOString(),
  };

  await redis.hset(key, productId, JSON.stringify(item));
  await redis.expire(key, CART_TTL);

  return item;
}

// ─── Get (grouped by vendor) ──────────────────────────────────────────────────

export async function getCart(userId: string): Promise<{
  groups: CartGroup[];
  total: number;
  itemCount: number;
}> {
  const raw = await redis.hgetall(cartKey(userId));

  if (!raw || Object.keys(raw).length === 0) {
    return { groups: [], total: 0, itemCount: 0 };
  }

  const items: CartItem[] = Object.values(raw).map((v) => JSON.parse(v));

  const vendorMap = new Map<string, CartGroup>();
  for (const item of items) {
    if (!vendorMap.has(item.vendorId)) {
      vendorMap.set(item.vendorId, {
        vendorId:   item.vendorId,
        vendorName: item.vendorName,
        storeId:    item.storeId,
        storeName:  item.storeName,
        items:      [],
        subtotal:   0,
      });
    }
    const group = vendorMap.get(item.vendorId)!;
    group.items.push(item);
    group.subtotal = Math.round((group.subtotal + item.sellingPrice) * 100) / 100;
  }

  const groups = Array.from(vendorMap.values());
  const total  = groups.reduce((sum, g) => Math.round((sum + g.subtotal) * 100) / 100, 0);

  return { groups, total, itemCount: items.length };
}

// ─── Remove one item ──────────────────────────────────────────────────────────

export async function removeFromCart(userId: string, productId: string): Promise<void> {
  const removed = await redis.hdel(cartKey(userId), productId);
  if (!removed) throw new NotFoundError('Cart item');
}

// ─── Clear entire cart ────────────────────────────────────────────────────────

export async function clearCart(userId: string): Promise<void> {
  await redis.del(cartKey(userId));
}

// ─── Raw items (used internally by order checkout) ───────────────────────────

export async function getRawCart(userId: string): Promise<CartItem[]> {
  const raw = await redis.hgetall(cartKey(userId));
  if (!raw || Object.keys(raw).length === 0) return [];
  return Object.values(raw).map((v) => JSON.parse(v));
}
