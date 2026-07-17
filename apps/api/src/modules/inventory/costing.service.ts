import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

type CostingMethod = 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD';

interface CostLayer {
  date: Date;
  quantity: number;
  unitCost: number;
  remainingQty: number;
}

@Injectable()
export class CostingService {

  async calculateInventoryValue(
    tenantId: string,
    productId: string,
    method: CostingMethod = 'WEIGHTED_AVERAGE',
  ) {
    const entries = await prisma.stockLedgerEntry.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: 'asc' },
    });

    if (entries.length === 0) {
      return { productId, method, totalQuantity: 0, totalValue: 0, unitCost: 0 };
    }

    const layers: CostLayer[] = [];
    let totalQty = 0;
    let totalValue = 0;

    for (const entry of entries) {
      const qty = Number(entry.quantity);
      const rate = Number(entry.valuationRate);

      if (qty > 0) {
        // Inbound
        layers.push({ date: entry.createdAt, quantity: qty, unitCost: rate, remainingQty: qty });
        totalQty += qty;
        totalValue += qty * rate;
      } else {
        // Outbound — consume from layers
        let remaining = Math.abs(qty);

        if (method === 'FIFO') {
          for (const layer of layers) {
            if (remaining <= 0) break;
            const consume = Math.min(layer.remainingQty, remaining);
            totalValue -= consume * layer.unitCost;
            layer.remainingQty -= consume;
            remaining -= consume;
          }
        } else if (method === 'LIFO') {
          for (let i = layers.length - 1; i >= 0; i--) {
            if (remaining <= 0) break;
            const layer = layers[i]!;
            const consume = Math.min(layer.remainingQty, remaining);
            totalValue -= consume * layer.unitCost;
            layer.remainingQty -= consume;
            remaining -= consume;
          }
        } else {
          // WEIGHTED_AVERAGE
          const avgCost = totalQty > 0 ? totalValue / totalQty : 0;
          totalValue -= Math.abs(qty) * avgCost;
        }

        totalQty += qty; // qty is negative
      }
    }

    totalQty = Math.max(0, totalQty);
    totalValue = Math.max(0, totalValue);
    const unitCost = totalQty > 0 ? totalValue / totalQty : 0;

    return {
      productId,
      method,
      totalQuantity: totalQty,
      totalValue: Math.round(totalValue * 100) / 100,
      unitCost: Math.round(unitCost * 100) / 100,
      layerCount: layers.filter((l) => l.remainingQty > 0).length,
    };
  }

  async calculateLandedCost(
    tenantId: string,
    receiptId: string,
    additionalCosts: Array<{ description: string; amount: number; allocateBy: 'QUANTITY' | 'VALUE' | 'WEIGHT' }>,
  ) {
    const receipt = await (prisma as any).purchaseReceipt?.findFirst?.({
      where: { id: receiptId, tenantId },
      include: { lineItems: true },
    });

    if (!receipt) throw new NotFoundException('Purchase receipt not found');

    const items = receipt.lineItems || [];
    const totalQty = items.reduce((s: number, li: any) => s + Number(li.receivedQty || li.quantity || 0), 0);
    const totalValue = items.reduce((s: number, li: any) => s + Number(li.totalAmount || 0), 0);

    const allocatedCosts: Array<{
      productId: string;
      originalCost: number;
      landedCost: number;
      allocations: Array<{ description: string; amount: number }>;
    }> = [];

    for (const item of items) {
      const qty = Number(item.receivedQty || item.quantity || 0);
      const value = Number(item.totalAmount || 0);
      const allocations: Array<{ description: string; amount: number }> = [];
      let additionalTotal = 0;

      for (const cost of additionalCosts) {
        let allocated = 0;
        if (cost.allocateBy === 'QUANTITY') {
          allocated = totalQty > 0 ? (qty / totalQty) * cost.amount : 0;
        } else {
          allocated = totalValue > 0 ? (value / totalValue) * cost.amount : 0;
        }
        allocated = Math.round(allocated * 100) / 100;
        allocations.push({ description: cost.description, amount: allocated });
        additionalTotal += allocated;
      }

      allocatedCosts.push({
        productId: item.productId,
        originalCost: value,
        landedCost: Math.round((value + additionalTotal) * 100) / 100,
        allocations,
      });
    }

    return {
      receiptId,
      itemCount: items.length,
      totalAdditionalCosts: additionalCosts.reduce((s, c) => s + c.amount, 0),
      allocatedCosts,
    };
  }

  async getValuationReport(tenantId: string, method: CostingMethod = 'WEIGHTED_AVERAGE') {
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: { id: true, name: true, sku: true },
    });

    const valuations = [];
    let grandTotal = 0;

    for (const product of products) {
      const val = await this.calculateInventoryValue(tenantId, product.id, method);
      if (val.totalQuantity > 0) {
        valuations.push({
          sku: product.sku,
          name: product.name,
          ...val,
        });
        grandTotal += val.totalValue;
      }
    }

    return {
      method,
      asOfDate: new Date().toISOString(),
      productCount: valuations.length,
      grandTotalValue: Math.round(grandTotal * 100) / 100,
      valuations,
    };
  }

  async getBarcodeProduct(tenantId: string, barcode: string) {
    const product = await prisma.product.findFirst({
      where: { tenantId, OR: [{ sku: barcode }, { barcode }] },
      include: { organization: true },
    });
    if (!product) throw new NotFoundException(`Product not found for barcode: ${barcode}`);

    const stockLevels = await prisma.inventoryItem.findMany({
      where: { tenantId, productId: product.id },
      include: { warehouse: true },
    });

    return {
      product,
      totalOnHand: stockLevels.reduce((s, sl) => s + Number(sl.quantity), 0),
      stockByWarehouse: stockLevels.map((sl) => ({
        warehouseId: sl.warehouseId,
        warehouseName: sl.warehouse?.name,
        onHand: Number(sl.quantity),
        reserved: Number(sl.reservedQty),
        available: Number(sl.quantity) - Number(sl.reservedQty),
      })),
    };
  }
}
