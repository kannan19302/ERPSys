import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

interface PricingResult {
  productId: string;
  basePrice: number;
  discountPct: number;
  discountAmount: number;
  finalPrice: number;
  appliedRule: string;
}

@Injectable()
export class PricingService {

  async calculatePrice(
    tenantId: string,
    productId: string,
    quantity: number,
    customerId?: string,
  ): Promise<PricingResult> {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const basePrice = Number(product.sellPrice || product.costPrice || 0);
    let discountPct = 0;
    let appliedRule = 'STANDARD';

    // Volume-based tiered pricing
    if (quantity >= 1000) { discountPct = 15; appliedRule = 'VOLUME_1000+'; }
    else if (quantity >= 500) { discountPct = 10; appliedRule = 'VOLUME_500+'; }
    else if (quantity >= 100) { discountPct = 5; appliedRule = 'VOLUME_100+'; }
    else if (quantity >= 50) { discountPct = 3; appliedRule = 'VOLUME_50+'; }

    // Customer tier discount
    if (customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
      if (customer) {
        const group = (customer as any).customerGroup || '';
        if (group === 'PLATINUM' || group === 'ENTERPRISE') discountPct = Math.max(discountPct, 20);
        else if (group === 'GOLD') discountPct = Math.max(discountPct, 12);
        else if (group === 'SILVER') discountPct = Math.max(discountPct, 8);
      }
    }

    const discountAmount = Math.round(basePrice * quantity * (discountPct / 100) * 100) / 100;
    const finalPrice = Math.round(basePrice * quantity * (1 - discountPct / 100) * 100) / 100;

    return { productId, basePrice, discountPct, discountAmount, finalPrice, appliedRule };
  }

  async checkAvailability(
    tenantId: string,
    productId: string,
    requestedQty: number,
    warehouseId?: string,
  ) {
    const where: Record<string, unknown> = { tenantId, productId };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await prisma.inventoryItem.findMany({ where: where as any });

    const totalOnHand = items.reduce((s, i) => s + Number(i.quantity), 0);
    const totalReserved = items.reduce((s, i) => s + Number(i.reservedQty), 0);
    const totalAvailable = totalOnHand - totalReserved;
    const canFulfill = totalAvailable >= requestedQty;

    let estimatedAvailableDate: string | null = null;
    if (!canFulfill) {
      const pendingOrders = await prisma.purchaseOrder.findMany({
        where: { tenantId, status: { in: ['ORDERED', 'APPROVED'] } },
        include: { lineItems: { where: { productId } } },
        orderBy: { expectedDate: 'asc' },
        take: 5,
      });

      let accumulated = totalAvailable;
      for (const po of pendingOrders) {
        for (const li of po.lineItems) {
          accumulated += Number(li.quantity);
          if (accumulated >= requestedQty && po.expectedDate) {
            estimatedAvailableDate = new Date(po.expectedDate).toISOString().slice(0, 10);
            break;
          }
        }
        if (estimatedAvailableDate) break;
      }
    }

    return {
      productId,
      requestedQty,
      totalOnHand,
      totalReserved,
      totalAvailable,
      canFulfill,
      shortfall: canFulfill ? 0 : requestedQty - totalAvailable,
      estimatedAvailableDate,
    };
  }
}
