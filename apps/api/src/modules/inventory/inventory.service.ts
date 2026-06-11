import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateProductInput } from '@unerp/shared';

@Injectable()
export class InventoryService {
  /**
   * List all products in the tenant.
   */
  async getProducts(tenantId: string) {
    return prisma.product.findMany({
      where: { tenantId },
      orderBy: { sku: 'asc' },
    });
  }

  /**
   * Create a new product.
   */
  async createProduct(tenantId: string, orgId: string, dto: CreateProductInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({
        where: { tenantId },
      });
      if (!org) {
        throw new BadRequestException('No Organization registered in this tenant');
      }
      resolvedOrgId = org.id;
    }

    // Check if SKU already exists
    const existing = await prisma.product.findFirst({
      where: { tenantId, sku: dto.sku },
    });
    if (existing) {
      throw new BadRequestException(`Product with SKU ${dto.sku} already exists.`);
    }

    return prisma.product.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description || null,
        type: dto.type,
        category: dto.category || null,
        unit: dto.unit,
        costPrice: new Prisma.Decimal(dto.costPrice),
        sellPrice: new Prisma.Decimal(dto.sellPrice),
        taxCategory: dto.taxCategory || null,
      },
    });
  }

  /**
   * List all warehouses in the tenant.
   */
  async getWarehouses(tenantId: string) {
    return prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Fetch all inventory items / stock levels.
   */
  async getStockLevels(tenantId: string) {
    return prisma.inventoryItem.findMany({
      where: { tenantId },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { quantity: 'desc' },
    });
  }

  async getSerialNumbers(tenantId: string) {
    return prisma.serialNumber.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { serialNumber: 'asc' },
    });
  }

  async createSerialNumber(
    tenantId: string,
    dto: { productId: string; warehouseId: string; serialNumber: string }
  ) {
    const existing = await prisma.serialNumber.findFirst({
      where: { tenantId, serialNumber: dto.serialNumber },
    });
    if (existing) throw new BadRequestException(`Serial number ${dto.serialNumber} already registered.`);

    return prisma.serialNumber.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        serialNumber: dto.serialNumber,
        status: 'AVAILABLE',
      },
    });
  }

  async getBatches(tenantId: string) {
    return prisma.batch.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async createBatch(
    tenantId: string,
    dto: { productId: string; batchNumber: string; expiryDate?: string; quantity: number; costPrice?: number }
  ) {
    const existing = await prisma.batch.findFirst({
      where: { tenantId, productId: dto.productId, batchNumber: dto.batchNumber },
    });
    if (existing) throw new BadRequestException(`Batch ${dto.batchNumber} already exists for this product.`);

    return prisma.batch.create({
      data: {
        tenantId,
        productId: dto.productId,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        quantity: new Prisma.Decimal(dto.quantity),
        costPrice: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null,
      },
    });
  }

  async getBinLocations(tenantId: string) {
    return prisma.binLocation.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createBinLocation(
    tenantId: string,
    dto: { warehouseId: string; name: string; zone?: string; shelf?: string; bin?: string }
  ) {
    const existing = await prisma.binLocation.findFirst({
      where: { tenantId, warehouseId: dto.warehouseId, name: dto.name },
    });
    if (existing) throw new BadRequestException(`Bin location ${dto.name} already exists in this warehouse.`);

    return prisma.binLocation.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        name: dto.name,
        zone: dto.zone || null,
        shelf: dto.shelf || null,
        bin: dto.bin || null,
      },
    });
  }

  async getCycleCounts(tenantId: string) {
    return prisma.cycleCount.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCycleCountById(tenantId: string, id: string) {
    const count = await prisma.cycleCount.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!count) throw new BadRequestException('Cycle count not found');
    return count;
  }

  async createCycleCount(
    tenantId: string,
    dto: { warehouseId: string; notes?: string; items: { productId: string; expectedQty: number; countedQty: number }[] },
    userId: string
  ) {
    return prisma.cycleCount.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        status: 'DRAFT',
        notes: dto.notes || null,
        countedBy: userId,
        items: {
          create: dto.items.map(item => ({
            tenantId,
            productId: item.productId,
            expectedQty: new Prisma.Decimal(item.expectedQty),
            countedQty: new Prisma.Decimal(item.countedQty),
            variance: new Prisma.Decimal(item.countedQty - item.expectedQty),
          })),
        },
      },
      include: { items: true },
    });
  }

  async completeCycleCount(tenantId: string, id: string) {
    const count = await prisma.cycleCount.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!count) throw new BadRequestException('Cycle count not found');
    if (count.status === 'COMPLETED') throw new BadRequestException('Cycle count already completed');

    return prisma.$transaction(async (tx) => {
      // Adjust actual inventory quantities in inventory_items table
      for (const item of count.items) {
        const existingItem = await tx.inventoryItem.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: count.warehouseId },
        });

        if (existingItem) {
          await tx.inventoryItem.update({
            where: { id: existingItem.id },
            data: { quantity: item.countedQty },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: count.warehouseId,
              quantity: item.countedQty,
            },
          });
        }
      }

      return tx.cycleCount.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          countedAt: new Date(),
        },
      });
    });
  }
}
