import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryEventHandler {
  private readonly logger = new Logger(InventoryEventHandler.name);

  @OnEvent('procurement.receipt.created')
  async handlePurchaseReceiptCreated(event: {
    tenantId: string;
    warehouseId: string | null;
    lineItems: Array<{
      productId: string | null;
      acceptedQty: number;
    }>;
    receiptNumber: string;
  }) {
    this.logger.log(`Handling procurement.receipt.created event for receipt: ${event.receiptNumber}`);
    if (!event.warehouseId) {
      this.logger.warn(`No warehouseId provided for receipt ${event.receiptNumber}. Skipping stock adjustment.`);
      return;
    }

    for (const item of event.lineItems) {
      if (!item.productId) continue;

      try {
        await prisma.inventoryItem.upsert({
          where: {
            tenantId_productId_warehouseId: {
              tenantId: event.tenantId,
              productId: item.productId,
              warehouseId: event.warehouseId,
            },
          },
          update: {
            quantity: {
              increment: new Prisma.Decimal(item.acceptedQty),
            },
          },
          create: {
            tenantId: event.tenantId,
            productId: item.productId,
            warehouseId: event.warehouseId,
            quantity: new Prisma.Decimal(item.acceptedQty),
          },
        });
        this.logger.log(`Increased stock for product ${item.productId} in warehouse ${event.warehouseId} by ${item.acceptedQty}`);
      } catch (err) {
        this.logger.error(`Failed to adjust stock for product ${item.productId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  @OnEvent('sales.delivery.created')
  async handleSalesDeliveryCreated(event: {
    tenantId: string;
    warehouseId: string | null;
    lineItems: Array<{
      productId: string | null;
      deliveredQty: number;
    }>;
    deliveryNumber: string;
  }) {
    this.logger.log(`Handling sales.delivery.created event for delivery: ${event.deliveryNumber}`);
    if (!event.warehouseId) {
      this.logger.warn(`No warehouseId provided for delivery ${event.deliveryNumber}. Skipping stock adjustment.`);
      return;
    }

    for (const item of event.lineItems) {
      if (!item.productId) continue;

      try {
        await prisma.inventoryItem.upsert({
          where: {
            tenantId_productId_warehouseId: {
              tenantId: event.tenantId,
              productId: item.productId,
              warehouseId: event.warehouseId,
            },
          },
          update: {
            quantity: {
              decrement: new Prisma.Decimal(item.deliveredQty),
            },
          },
          create: {
            tenantId: event.tenantId,
            productId: item.productId,
            warehouseId: event.warehouseId,
            quantity: new Prisma.Decimal(-item.deliveredQty),
          },
        });
        this.logger.log(`Decreased stock for product ${item.productId} in warehouse ${event.warehouseId} by ${item.deliveredQty}`);
      } catch (err) {
        this.logger.error(`Failed to adjust stock for product ${item.productId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  @OnEvent('manufacturing.workorder.completed')
  async handleWorkOrderCompleted(event: {
    tenantId: string;
    workOrderId: string;
    productId: string;
    quantity: number;
    warehouseId: string | null;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  }) {
    this.logger.log(`Handling manufacturing.workorder.completed event for workorder: ${event.workOrderId}`);
    if (!event.warehouseId) {
      this.logger.warn(`No warehouseId provided for workorder ${event.workOrderId}. Skipping inventory transactions.`);
      return;
    }

    try {
      // 1. Consume raw materials (decrement stock)
      for (const item of event.items) {
        await prisma.inventoryItem.upsert({
          where: {
            tenantId_productId_warehouseId: {
              tenantId: event.tenantId,
              productId: item.productId,
              warehouseId: event.warehouseId,
            },
          },
          update: {
            quantity: {
              decrement: new Prisma.Decimal(item.quantity),
            },
          },
          create: {
            tenantId: event.tenantId,
            productId: item.productId,
            warehouseId: event.warehouseId,
            quantity: new Prisma.Decimal(-item.quantity),
          },
        });
        this.logger.log(`Consumed stock for product ${item.productId} in warehouse ${event.warehouseId} by ${item.quantity}`);
      }

      // 2. Produce finished goods (increment stock)
      await prisma.inventoryItem.upsert({
        where: {
          tenantId_productId_warehouseId: {
            tenantId: event.tenantId,
            productId: event.productId,
            warehouseId: event.warehouseId,
          },
        },
        update: {
          quantity: {
            increment: new Prisma.Decimal(event.quantity),
          },
        },
        create: {
          tenantId: event.tenantId,
          productId: event.productId,
          warehouseId: event.warehouseId,
          quantity: new Prisma.Decimal(event.quantity),
        },
      });
      this.logger.log(`Produced stock for finished product ${event.productId} in warehouse ${event.warehouseId} by ${event.quantity}`);
    } catch (err) {
      this.logger.error(`Failed to execute inventory transactions for workorder ${event.workOrderId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
