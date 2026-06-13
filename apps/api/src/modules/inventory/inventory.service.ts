import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma, PrismaClient } from '@prisma/client';
import { CreateProductInput, CreateStockEntryInput, CreateQualityInspectionInput } from '@unerp/shared';

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
    const db = prisma as unknown as PrismaClient;
    return db.cycleCount.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCycleCountById(tenantId: string, id: string) {
    const db = prisma as unknown as PrismaClient;
    const count = await db.cycleCount.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } } },
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

        const rateRes = await tx.product.findUnique({
          where: { id: item.productId },
          select: { costPrice: true }
        });
        const rate = rateRes?.costPrice || new Prisma.Decimal(0);

        if (existingItem) {
          const variance = item.countedQty.minus(existingItem.quantity);
          if (!variance.isZero()) {
            // Write ledger entry for variance adjustment
            await tx.stockLedgerEntry.create({
              data: {
                tenantId,
                productId: item.productId,
                warehouseId: count.warehouseId,
                quantity: variance,
                valuationRate: rate,
                voucherType: 'CYCLE_COUNT',
                voucherId: id,
              }
            });
          }

          await tx.inventoryItem.update({
            where: { id: existingItem.id },
            data: { quantity: item.countedQty },
          });
        } else {
          // Write ledger entry for initial creation
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: count.warehouseId,
              quantity: item.countedQty,
              valuationRate: rate,
              voucherType: 'CYCLE_COUNT',
              voucherId: id,
            }
          });

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

  // ════════════════════════════════════════════════
  // STOCK ENTRY TRANSACTIONS (RECEIPT, ISSUE, TRANSFER)
  // ════════════════════════════════════════════════

  async getStockEntries(tenantId: string) {
    return prisma.stockEntry.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { postingDate: 'desc' },
    });
  }

  async createStockEntry(tenantId: string, orgId: string, dto: CreateStockEntryInput, userId: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      resolvedOrgId = org?.id || 'default-org';
    }

    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const entryNumber = `STE-${dateStr}-${uniqueId}`;

    const itemsData = await Promise.all(
      dto.items.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { costPrice: true },
        });
        const valRate = prod?.costPrice || new Prisma.Decimal(0);
        return {
          tenantId,
          productId: item.productId,
          qty: new Prisma.Decimal(item.qty),
          valuationRate: valRate,
          amount: valRate.mul(item.qty),
          batchNumber: item.batchNumber || null,
          serialNumber: item.serialNumber || null,
        };
      })
    );

    return prisma.stockEntry.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        entryNumber,
        purpose: dto.purpose,
        remarks: dto.remarks || null,
        fromWarehouseId: dto.fromWarehouseId || null,
        toWarehouseId: dto.toWarehouseId || null,
        createdBy: userId,
        items: {
          create: itemsData,
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async submitStockEntry(tenantId: string, id: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!entry) throw new BadRequestException('Stock entry not found');
    if (entry.status !== 'DRAFT') throw new BadRequestException('Only DRAFT stock entries can be submitted');

    // Perform validation and transactional updates
    return prisma.$transaction(async (tx) => {
      for (const item of entry.items) {
        // 1. Decrement Stock from source warehouse (if transfer or issue)
        if (entry.purpose === 'MATERIAL_ISSUE' || entry.purpose === 'MATERIAL_TRANSFER') {
          if (!entry.fromWarehouseId) {
            throw new BadRequestException('Source warehouse is required for issues or transfers');
          }

          const existing = await tx.inventoryItem.findFirst({
            where: { tenantId, productId: item.productId, warehouseId: entry.fromWarehouseId },
          });

          if (!existing || existing.quantity.lessThan(item.qty)) {
            throw new BadRequestException(
              `Insufficient stock for product ${item.productId} in source warehouse.`
            );
          }

          await tx.inventoryItem.update({
            where: { id: existing.id },
            data: { quantity: { decrement: item.qty } },
          });

          // Write negative StockLedgerEntry
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: entry.fromWarehouseId,
              quantity: item.qty.negated(),
              valuationRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNumber,
            },
          });
        }

        // 2. Increment Stock in target warehouse (if transfer or receipt)
        if (entry.purpose === 'MATERIAL_RECEIPT' || entry.purpose === 'MATERIAL_TRANSFER') {
          if (!entry.toWarehouseId) {
            throw new BadRequestException('Target warehouse is required for receipts or transfers');
          }

          await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: entry.toWarehouseId,
              },
            },
            update: { quantity: { increment: item.qty } },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: entry.toWarehouseId,
              quantity: item.qty,
            },
          });

          // Write positive StockLedgerEntry
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: entry.toWarehouseId,
              quantity: item.qty,
              valuationRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNumber,
            },
          });
        }
      }

      // Update StockEntry status to SUBMITTED
      return tx.stockEntry.update({
        where: { id },
        data: { status: 'SUBMITTED' },
        include: { items: { include: { product: true } } },
      });
    });
  }

  // ════════════════════════════════════════════════
  // STOCK LEDGER & VALUATIONS
  // ════════════════════════════════════════════════

  async getStockLedger(tenantId: string, filters?: { productId?: string; warehouseId?: string }) {
    const whereClause: Prisma.StockLedgerEntryWhereInput = { tenantId };
    if (filters?.productId) whereClause.productId = filters.productId;
    if (filters?.warehouseId) whereClause.warehouseId = filters.warehouseId;

    return prisma.stockLedgerEntry.findMany({
      where: whereClause,
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getValuationReport(tenantId: string) {
    const ledger = await prisma.stockLedgerEntry.findMany({
      where: { tenantId },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group ledger transactions by Product & Warehouse to compute moving average values
    const groups: Record<string, { productSku: string; productName: string; warehouseName: string; totalQty: number; totalValuation: number; avgRate: number }> = {};

    for (const entry of ledger) {
      const key = `${entry.productId}_${entry.warehouseId}`;
      if (!groups[key]) {
        groups[key] = {
          productSku: entry.product.sku,
          productName: entry.product.name,
          warehouseName: entry.warehouse.name,
          totalQty: 0,
          totalValuation: 0,
          avgRate: 0,
        };
      }

      const qty = Number(entry.quantity);
      const rate = Number(entry.valuationRate);
      const g = groups[key];

      if (qty > 0) {
        g.totalValuation += qty * rate;
        g.totalQty += qty;
        g.avgRate = g.totalQty > 0 ? g.totalValuation / g.totalQty : 0;
      } else {
        // For reduction, cost matches current average rate
        const decreaseVal = Math.abs(qty) * g.avgRate;
        g.totalValuation -= decreaseVal;
        g.totalQty += qty; // qty is negative
        if (g.totalQty <= 0) {
          g.totalQty = 0;
          g.totalValuation = 0;
          g.avgRate = 0;
        }
      }
    }

    return Object.values(groups);
  }

  // ════════════════════════════════════════════════
  // QUALITY CONTROL & INSPECTION
  // ════════════════════════════════════════════════

  async getQualityInspections(tenantId: string) {
    return prisma.qualityInspection.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { inspectedDate: 'desc' },
    });
  }

  async createQualityInspection(tenantId: string, orgId: string, dto: CreateQualityInspectionInput, userId: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      resolvedOrgId = org?.id || 'default-org';
    }

    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const inspectionNumber = `QA-INSP-${uniqueId}`;

    return prisma.qualityInspection.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        inspectionNumber,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        productId: dto.productId,
        status: dto.passedQty >= dto.inspectedQty ? 'PASSED' : 'FAILED',
        inspectedQty: new Prisma.Decimal(dto.inspectedQty),
        passedQty: new Prisma.Decimal(dto.passedQty),
        rejectedQty: new Prisma.Decimal(dto.rejectedQty),
        inspectedBy: userId,
        checklist: dto.checklist as Prisma.InputJsonValue,
      },
      include: { product: true },
    });
  }
}
