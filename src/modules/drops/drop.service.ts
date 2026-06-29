import { prisma } from '../../config/database';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/AppError';
import { getIo } from '../../sockets';
import { CreateDropInput } from './drop.schema';

export async function createDrop(userId: string, storeId: string, input: CreateDropInput) {
  const vendor = await prisma.vendor.findUnique({
    where:  { userId },
    select: { id: true },
  });
  if (!vendor) throw new NotFoundError('Vendor profile');

  const store = await prisma.store.findUnique({
    where:  { id: storeId },
    select: { id: true, name: true, vendorId: true },
  });
  if (!store) throw new NotFoundError('Store');
  if (store.vendorId !== vendor.id) throw new ForbiddenError('You do not own this store');

  if (input.productIds.length > 0) {
    const found = await prisma.product.findMany({
      where:  { id: { in: input.productIds }, storeId },
      select: { id: true },
    });
    if (found.length !== input.productIds.length) {
      throw new ValidationError({ productIds: ['One or more products do not belong to this store'] });
    }
  }

  const drop = await prisma.drop.create({
    data: {
      storeId,
      vendorId:    vendor.id,
      dropTitle:   input.dropTitle,
      description: input.description ?? null,
      scheduledAt: new Date(input.scheduledAt),
      productIds:  input.productIds,
    },
  });

  // Emit to all authenticated buyers whose sockets are in this store's room
  try {
    getIo().to(`store:${storeId}`).emit('drop:scheduled', {
      dropId:       drop.id,
      storeId,
      storeName:    store.name,
      dropTitle:    drop.dropTitle,
      scheduledAt:  drop.scheduledAt,
      productCount: input.productIds.length,
    });
  } catch {
    // Socket server not initialised (e.g. test environment) — non-fatal
  }

  return drop;
}
