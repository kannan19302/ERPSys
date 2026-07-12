import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import {
  CreateProductInput, UpdateProductInput,
  CreateCategoryInput, UpdateCategoryInput,
  CreateVariantInput, CreateBinLocationInput,
  CreateSerialNumberInput, UpdateSerialNumberInput,
  CreateBatchInput, UpdateBatchInput,
  CreateCycleCountInput, SubmitCycleCountInput,
  CreateCycleCountScheduleInput, UpdateCycleCountScheduleInput,
  CreateLicensePlateInput, AddLicensePlateItemInput, MoveLicensePlateInput,
  CreatePutawayTaskInput, CompletePutawayTaskInput,
  CreateQAInspectionInput, SubmitQAInspectionInput,
  CreateReorderRuleInput, CreateKitInput,
  CreateStockEntryInput,
  TransferStockInput,
} from '@unerp/shared';
import { Prisma } from '@prisma/client';

import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  resolveOrgId,
  PaginatedResult,
  PaginationParams,
} from '../../common/utils/pagination.util';

@Injectable()
export class InventoryService {
  constructor() {}

  // ─── PRODUCTS ─────────────────────────────────────

  async getProducts(
    tenantId: string,
    params: PaginationParams & { type?: string; category?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null };
    if (params.type) where.type = params.type;
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take, orderBy: orderBy as any }),
      prisma.product.count({ where }),
    ]);

    const data = (products as any[]).map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      type: p.type,
      category: p.category,
      unit: p.unit,
      costPrice: Number(p.costPrice),
      sellPrice: Number(p.sellPrice),
      isActive: p.isActive,
    }));

    return paginatedResult(data, total, params);
  }

  async getProductById(tenantId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        inventoryItems: { include: { warehouse: true } },
        variants: true,
        productCategory: true,
        _count: { select: { invoiceLines: true, purchaseOrderItems: true, salesOrderItems: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(tenantId: string, orgId: string, dto: CreateProductInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const existing = await prisma.product.findFirst({
      where: { tenantId, orgId: resolvedOrgId, sku: dto.sku },
    });
    if (existing) throw new BadRequestException(`Product SKU ${dto.sku} already exists.`);

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

  async updateProduct(tenantId: string, id: string, dto: UpdateProductInput) {
    const product = await prisma.product.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');

    return prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        category: dto.category,
        unit: dto.unit,
        costPrice: dto.costPrice !== undefined ? new Prisma.Decimal(dto.costPrice) : undefined,
        sellPrice: dto.sellPrice !== undefined ? new Prisma.Decimal(dto.sellPrice) : undefined,
        taxCategory: dto.taxCategory,
      },
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    const product = await prisma.product.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');

    await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { success: true };
  }

  // ─── STOCK LEVELS ────────────────────────────────────

  async getStockLevels(tenantId: string, params: PaginationParams & { warehouseId?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.search) {
      where.product = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const { skip, take } = buildPaginationValues(params);

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          warehouse: { select: { id: true, name: true } },
        },
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return paginatedResult(items, total, params);
  }

  // ─── BULK ──────────────────────────────────────────

  async bulkAction(tenantId: string, action: string, ids: string[], _data?: Record<string, unknown>) {
    const results: Array<{ id: string; status: 'success' | 'error'; error?: string }> = [];

    for (const id of ids) {
      try {
        switch (action) {
          case 'delete':
            await this.deleteProduct(tenantId, id);
            break;
          default:
            throw new BadRequestException(`Unsupported action: ${action}`);
        }
        results.push({ id, status: 'success' });
      } catch (err: any) {
        results.push({ id, status: 'error', error: err.message });
      }
    }

    return {
      total: ids.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'error').length,
      results,
    };
  }

  // ─── STATS ─────────────────────────────────────────

  async getInventoryStats(tenantId: string) {
    const [totalProducts, activeProducts, totalWarehouses, lowStockItems] = await Promise.all([
      prisma.product.count({ where: { tenantId, deletedAt: null } }),
      prisma.product.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      prisma.warehouse.count({ where: { tenantId, isActive: true } }),
      prisma.inventoryItem.count({
        where: {
          tenantId,
          reorderPoint: { not: null },
          quantity: { lte: prisma.inventoryItem.fields?.reorderPoint ?? 0 },
        },
      }),
    ]);

    return { totalProducts, activeProducts, totalWarehouses, lowStockItems };
  }

  // ─── PRODUCT CATEGORIES ─────────────────────────────

  async getCategories(tenantId: string, params: PaginationParams = {}) {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);

    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        include: { parent: true },
        skip,
        take,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.productCategory.count({ where }),
    ]);

    return paginatedResult(categories, total, params);
  }

  async getCategoryById(tenantId: string, id: string) {
    const category = await prisma.productCategory.findFirst({
      where: { id, tenantId },
      include: { parent: true, children: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(tenantId: string, orgId: string, dto: CreateCategoryInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.productCategory.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: UpdateCategoryInput) {
    const category = await prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Category not found');

    return prisma.productCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    const category = await prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Category not found');

    await prisma.productCategory.delete({ where: { id } });
    return { success: true };
  }

  // ─── PRODUCT VARIANTS ───────────────────────────────

  async getProductVariants(tenantId: string, parentSkuId: string) {
    return prisma.productVariant.findMany({
      where: { tenantId, parentSkuId, deletedAt: null },
    });
  }

  async createProductVariant(tenantId: string, dto: CreateVariantInput) {
    return prisma.productVariant.create({
      data: {
        tenantId,
        parentSkuId: dto.parentSkuId,
        sku: dto.sku,
        name: dto.name,
        attributes: (dto.attributes || {}) as any,
        costPrice: new Prisma.Decimal(dto.costPrice),
        sellPrice: new Prisma.Decimal(dto.sellPrice),
        barcode: dto.barcode,
        isActive: dto.isActive,
      },
    });
  }

  async updateProductVariant(tenantId: string, id: string, dto: any) {
    const variant = await prisma.productVariant.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!variant) throw new NotFoundException('Product variant not found');

    return prisma.productVariant.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        attributes: dto.attributes,
        costPrice: dto.costPrice !== undefined ? new Prisma.Decimal(dto.costPrice) : undefined,
        sellPrice: dto.sellPrice !== undefined ? new Prisma.Decimal(dto.sellPrice) : undefined,
        barcode: dto.barcode,
        isActive: dto.isActive,
      },
    });
  }

  async deleteProductVariant(tenantId: string, id: string) {
    const variant = await prisma.productVariant.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!variant) throw new NotFoundException('Product variant not found');

    await prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }

  // ─── UNITS OF MEASURE ───────────────────────────────

  async getUoMs(tenantId: string) {
    return prisma.unitOfMeasure.findMany({
      where: { tenantId, isActive: true },
    });
  }

  async createUoM(tenantId: string, dto: any) {
    return prisma.unitOfMeasure.create({
      data: {
        tenantId,
        name: dto.name,
        abbreviation: dto.abbreviation,
        type: dto.type,
        isBase: dto.isBase,
        isActive: dto.isActive,
      },
    });
  }

  async getUoMConversions(tenantId: string) {
    return prisma.uoMConversion.findMany({
      where: { tenantId },
      include: { fromUoM: true, toUoM: true },
    });
  }

  async createUoMConversion(tenantId: string, dto: any) {
    return prisma.uoMConversion.create({
      data: {
        tenantId,
        fromUoMId: dto.fromUoMId,
        toUoMId: dto.toUoMId,
        factor: new Prisma.Decimal(dto.factor),
      },
    });
  }

  // ─── BIN LOCATIONS ──────────────────────────────────

  async getBinLocations(tenantId: string, warehouseId?: string) {
    const where: any = { tenantId, isActive: true };
    if (warehouseId) where.warehouseId = warehouseId;

    return prisma.binLocation.findMany({
      where,
      include: { warehouse: true },
      orderBy: { code: 'asc' },
    });
  }

  async getBinLocationById(tenantId: string, id: string) {
    const bin = await prisma.binLocation.findFirst({
      where: { id, tenantId },
      include: { warehouse: true },
    });
    if (!bin) throw new NotFoundException('Bin location not found');
    return bin;
  }

  async createBinLocation(tenantId: string, dto: CreateBinLocationInput) {
    return prisma.binLocation.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        zone: dto.zone || 'A',
        aisle: dto.aisle,
        rack: dto.rack,
        bin: dto.bin,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity ? new Prisma.Decimal(dto.capacity) : null,
        isActive: dto.isActive,
      },
    });
  }

  async updateBinLocation(tenantId: string, id: string, dto: any) {
    const bin = await prisma.binLocation.findFirst({ where: { id, tenantId } });
    if (!bin) throw new NotFoundException('Bin location not found');

    return prisma.binLocation.update({
      where: { id },
      data: {
        zone: dto.zone,
        aisle: dto.aisle,
        rack: dto.rack,
        bin: dto.bin,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity ? new Prisma.Decimal(dto.capacity) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteBinLocation(tenantId: string, id: string) {
    const bin = await prisma.binLocation.findFirst({ where: { id, tenantId } });
    if (!bin) throw new NotFoundException('Bin location not found');

    await prisma.binLocation.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  // ─── TRACEABILITY (SERIAL NUMBERS) ──────────────────

  async getSerialNumbers(tenantId: string, params: PaginationParams & { productId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.serialNo = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [serials, total] = await Promise.all([
      prisma.serialNumber.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serialNumber.count({ where }),
    ]);

    return paginatedResult(serials, total, params);
  }

  async getSerialNumberById(tenantId: string, id: string) {
    const sn = await prisma.serialNumber.findFirst({
      where: { id, tenantId },
      include: { product: true, history: true },
    });
    if (!sn) throw new NotFoundException('Serial number not found');
    return sn;
  }

  async createSerialNumber(tenantId: string, dto: CreateSerialNumberInput) {
    return prisma.serialNumber.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        serialNo: dto.serialNo,
        status: dto.status || 'AVAILABLE',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
        purchaseOrderId: dto.purchaseOrderId,
        salesOrderId: dto.salesOrderId,
        notes: dto.notes,
        customFields: (dto.customFields || {}) as any,
      },
    });
  }

  async updateSerialNumber(tenantId: string, id: string, dto: UpdateSerialNumberInput) {
    const sn = await prisma.serialNumber.findFirst({ where: { id, tenantId } });
    if (!sn) throw new NotFoundException('Serial number not found');

    const updateData: any = {
      status: dto.status,
      warehouseId: dto.warehouseId,
      notes: dto.notes,
      customFields: dto.customFields,
    };
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.warrantyExpiry !== undefined) updateData.warrantyExpiry = dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null;

    return prisma.serialNumber.update({
      where: { id },
      data: updateData,
    });
  }

  async getSerialNumberHistory(tenantId: string, serialNumberId: string) {
    return prisma.serialNumberHistory.findMany({
      where: { tenantId, serialNumberId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── BATCH / LOT CONTROL ─────────────────────────────

  async getBatches(tenantId: string, params: PaginationParams & { productId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.batchNo = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.batch.count({ where }),
    ]);

    return paginatedResult(batches, total, params);
  }

  async getBatchById(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({
      where: { id, tenantId },
      include: { product: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async createBatch(tenantId: string, dto: CreateBatchInput) {
    return prisma.batch.create({
      data: {
        tenantId,
        productId: dto.productId,
        batchNo: dto.batchNo,
        lotNo: dto.lotNo,
        quantity: new Prisma.Decimal(dto.quantity),
        manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        supplierBatchNo: dto.supplierBatchNo,
        costPrice: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null,
        status: dto.status || 'ACTIVE',
        notes: dto.notes,
      },
    });
  }

  async updateBatch(tenantId: string, id: string, dto: UpdateBatchInput) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');

    const updateData: any = {
      lotNo: dto.lotNo,
      status: dto.status,
      notes: dto.notes,
      supplierBatchNo: dto.supplierBatchNo,
    };
    if (dto.quantity !== undefined) updateData.quantity = new Prisma.Decimal(dto.quantity);
    if (dto.manufactureDate !== undefined) updateData.manufactureDate = dto.manufactureDate ? new Date(dto.manufactureDate) : null;
    if (dto.expiryDate !== undefined) updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null;

    return prisma.batch.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── STOCK ENTRIES & LEDGER ─────────────────────────

  async getStockEntries(tenantId: string, params: PaginationParams & { type?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.entryNumber = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [entries, total] = await Promise.all([
      prisma.stockEntry.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip,
        take,
        orderBy: { postingDate: 'desc' },
      }),
      prisma.stockEntry.count({ where }),
    ]);

    return paginatedResult(entries, total, params);
  }

  async getStockEntryById(tenantId: string, id: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true, fromBin: true, toBin: true, batch: true } }, ledgerEntries: true },
    });
    if (!entry) throw new NotFoundException('Stock entry not found');
    return entry;
  }

  async createStockEntry(tenantId: string, orgId: string, userId: string, dto: CreateStockEntryInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.stockEntry.count({ where: { tenantId } });
    const entryNumber = `STE-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    let totalValue = 0;
    const itemsData = dto.items.map((item) => {
      const valRate = item.valuationRate || 0;
      const amt = valRate * item.qty;
      totalValue += amt;

      return {
        tenantId,
        productId: item.productId,
        fromWarehouseId: item.fromWarehouseId || dto.fromWarehouseId,
        toWarehouseId: item.toWarehouseId || dto.toWarehouseId,
        fromBinId: item.fromBinId,
        toBinId: item.toBinId,
        uomId: item.uomId,
        qty: new Prisma.Decimal(item.qty),
        quantity: new Prisma.Decimal(item.qty),
        valuationRate: new Prisma.Decimal(valRate),
        amount: new Prisma.Decimal(amt),
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        serialNo: item.serialNo,
        serialNumber: item.serialNumber || item.serialNo,
      };
    });

    return prisma.stockEntry.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        entryNumber,
        type: dto.type,
        purpose: dto.purpose || dto.type,
        remarks: dto.remarks,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        referenceDoc: dto.referenceDoc,
        referenceType: dto.referenceType,
        totalValue: new Prisma.Decimal(totalValue),
        createdBy: userId,
        status: 'DRAFT',
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async submitStockEntry(tenantId: string, id: string, userId: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId, status: 'DRAFT' },
      include: { items: { include: { product: true } } },
    });
    if (!entry) throw new NotFoundException('Draft Stock Entry not found');

    await prisma.$transaction(async (tx) => {
      for (const item of entry.items) {
        // Adjust inventory levels & create ledger entries
        // 1. Deduct from source warehouse
        if (item.fromWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
              },
            },
            update: {
              quantity: { decrement: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
            },
          });

          // Check if there is a bin location from which to deduct
          if (item.fromBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.fromWarehouseId,
                  binLocationId: item.fromBinId,
                },
              },
              update: {
                quantity: { decrement: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
                binLocationId: item.fromBinId,
                quantity: new Prisma.Decimal(-Number(item.quantity)),
              },
            });
          }

          // Create ledger entry (OUT)
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              stockEntryId: entry.id,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
              qtyOut: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: entry.entryNumber,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNo,
            },
          });
        }

        // 2. Add to destination warehouse
        if (item.toWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              quantity: item.quantity,
            },
          });

          // Bin level update
          if (item.toBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.toWarehouseId,
                  binLocationId: item.toBinId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
                binLocationId: item.toBinId,
                quantity: item.quantity,
              },
            });
          }

          // Create ledger entry (IN)
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              stockEntryId: entry.id,
              quantity: item.quantity,
              qtyIn: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: entry.entryNumber,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNo,
            },
          });
        }

        // 3. Serial Number Updates
        if (item.serialNo && item.product.hasSerialTracking) {
          const serialRec = await tx.serialNumber.findFirst({
            where: { tenantId, productId: item.productId, serialNo: item.serialNo },
          });

          if (serialRec) {
            let nextStatus = 'AVAILABLE';
            if (entry.type === 'MATERIAL_ISSUE' || entry.type === 'SCRAP') {
              nextStatus = entry.type === 'SCRAP' ? 'SCRAPPED' : 'SOLD';
            } else if (item.toWarehouseId) {
              nextStatus = 'AVAILABLE';
            }

            await tx.serialNumber.update({
              where: { id: serialRec.id },
              data: {
                status: nextStatus,
                warehouseId: item.toWarehouseId || null,
              },
            });

            await tx.serialNumberHistory.create({
              data: {
                tenantId,
                serialNumberId: serialRec.id,
                action: entry.type,
                fromStatus: serialRec.status,
                toStatus: nextStatus,
                reference: entry.entryNumber,
                performedBy: userId,
              },
            });
          }
        }

        // 4. Batch Level Updates
        if (item.batchId && item.product.hasBatchTracking) {
          if (item.fromWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                usedQty: { increment: item.quantity },
              },
            });
          } else if (item.toWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          }
        }
      }

      await tx.stockEntry.update({
        where: { id: entry.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          submittedBy: userId,
        },
      });
    });

    return this.getStockEntryById(tenantId, id);
  }

  async cancelStockEntry(tenantId: string, id: string, userId: string, reason: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId, status: 'SUBMITTED' },
      include: { items: { include: { product: true } } },
    });
    if (!entry) throw new NotFoundException('Submitted Stock Entry not found');

    await prisma.$transaction(async (tx) => {
      // Reverse each item's stock adjustment
      for (const item of entry.items) {
        // Reverse source warehouse deduction (we increment it back)
        if (item.fromWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              quantity: item.quantity,
            },
          });

          if (item.fromBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.fromWarehouseId,
                  binLocationId: item.fromBinId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
                binLocationId: item.fromBinId,
                quantity: item.quantity,
              },
            });
          }

          // Ledger entry showing reversal
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              stockEntryId: entry.id,
              quantity: item.quantity,
              qtyIn: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: `${entry.entryNumber}-REV`,
              remarks: `Reversal of ${entry.entryNumber}`,
            },
          });
        }

        // Reverse destination warehouse addition (we decrement it)
        if (item.toWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
              },
            },
            update: {
              quantity: { decrement: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
            },
          });

          if (item.toBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.toWarehouseId,
                  binLocationId: item.toBinId,
                },
              },
              update: {
                quantity: { decrement: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
                binLocationId: item.toBinId,
                quantity: new Prisma.Decimal(-Number(item.quantity)),
              },
            });
          }

          // Ledger entry showing reversal
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              stockEntryId: entry.id,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
              qtyOut: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: `${entry.entryNumber}-REV`,
              remarks: `Reversal of ${entry.entryNumber}`,
            },
          });
        }

        // Reverse serial updates
        if (item.serialNo && item.product.hasSerialTracking) {
          const serialRec = await tx.serialNumber.findFirst({
            where: { tenantId, productId: item.productId, serialNo: item.serialNo },
          });
          if (serialRec) {
            await tx.serialNumber.update({
              where: { id: serialRec.id },
              data: {
                status: 'AVAILABLE',
                warehouseId: item.fromWarehouseId || null,
              },
            });
            await tx.serialNumberHistory.create({
              data: {
                tenantId,
                serialNumberId: serialRec.id,
                action: 'CANCEL',
                fromStatus: serialRec.status,
                toStatus: 'AVAILABLE',
                reference: `${entry.entryNumber}-REV`,
                performedBy: userId,
              },
            });
          }
        }

        // Reverse batch updates
        if (item.batchId && item.product.hasBatchTracking) {
          if (item.fromWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                usedQty: { decrement: item.quantity },
              },
            });
          } else if (item.toWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
          }
        }
      }

      await tx.stockEntry.update({
        where: { id: entry.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });
    });

    return this.getStockEntryById(tenantId, id);
  }

  async getStockLedger(
    tenantId: string,
    params: PaginationParams & { productId?: string; warehouseId?: string } = {},
  ) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    if (params.search) {
      where.OR = [
        { voucherNumber: { contains: params.search, mode: 'insensitive' } },
        { batchNumber: { contains: params.search, mode: 'insensitive' } },
        { serialNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = buildPaginationValues(params);

    const [entries, total] = await Promise.all([
      prisma.stockLedgerEntry.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          warehouse: { select: { name: true, code: true } },
        },
        skip,
        take,
        orderBy: { postingDate: 'desc' },
      }),
      prisma.stockLedgerEntry.count({ where }),
    ]);

    return paginatedResult(entries, total, params);
  }

  // ─── INTER-WAREHOUSE TRANSFERS ──────────────────────

  async transferStock(tenantId: string, orgId: string, userId: string, dto: TransferStockInput) {
    const stockItems = dto.items.map((item, index) => ({
      productId: item.productId,
      qty: item.qty,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      batchId: item.batchId,
      serialNo: item.serialNo,
      sortOrder: index,
    }));

    return this.createStockEntry(tenantId, orgId, userId, {
      type: 'MATERIAL_TRANSFER',
      purpose: 'MATERIAL_TRANSFER',
      remarks: dto.remarks || `Inter-warehouse transfer from ${dto.fromWarehouseId} to ${dto.toWarehouseId}`,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      items: stockItems,
    });
  }

  // ─── CYCLE COUNTS ───────────────────────────────────

  async getCycleCounts(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;

    const { skip, take } = buildPaginationValues(params);

    const [counts, total] = await Promise.all([
      prisma.cycleCount.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cycleCount.count({ where }),
    ]);

    return paginatedResult(counts, total, params);
  }

  async getCycleCountById(tenantId: string, id: string) {
    const cc = await prisma.cycleCount.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } } },
    });
    if (!cc) throw new NotFoundException('Cycle count session not found');
    return cc;
  }

  async createCycleCount(tenantId: string, _orgId: string, userId: string, dto: CreateCycleCountInput) {
    const itemsData = dto.items.map((item) => ({
      tenantId,
      productId: item.productId,
      binLocationId: item.binLocationId,
      expectedQty: new Prisma.Decimal(item.expectedQty),
      status: 'PENDING',
    }));

    return prisma.cycleCount.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        countedBy: dto.countedBy || userId,
        notes: dto.notes,
        status: 'DRAFT',
        createdBy: userId,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async submitCycleCount(tenantId: string, id: string, userId: string, dto: SubmitCycleCountInput) {
    const cc = await prisma.cycleCount.findFirst({
      where: { id, tenantId, status: 'DRAFT' },
      include: { items: true },
    });
    if (!cc) throw new NotFoundException('Draft Cycle Count session not found');

    let totalVariance = 0;

    await prisma.$transaction(async (tx) => {
      for (const update of dto.items) {
        const item = cc.items.find((i) => i.id === update.id);
        if (!item) continue;

        const expected = Number(item.expectedQty);
        const counted = update.countedQty;
        const diff = counted - expected;
        totalVariance += Math.abs(diff);

        await tx.cycleCountItem.update({
          where: { id: item.id },
          data: {
            countedQty: new Prisma.Decimal(counted),
            varianceQty: new Prisma.Decimal(diff),
            variance: new Prisma.Decimal(diff),
            status: 'COUNTED',
            countedBy: userId,
            countedAt: new Date(),
            remarks: update.remarks,
          },
        });
      }

      await tx.cycleCount.update({
        where: { id: cc.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          variance: new Prisma.Decimal(totalVariance),
          remarks: dto.remarks,
        },
      });
    });

    return this.getCycleCountById(tenantId, id);
  }

  async approveCycleCount(tenantId: string, id: string, userId: string) {
    const cc = await prisma.cycleCount.findFirst({
      where: { id, tenantId, status: 'COMPLETED' },
      include: { items: { include: { product: true } } },
    });
    if (!cc) throw new NotFoundException('Completed Cycle Count session not found');

    // Create an automatic STOCK_ADJUSTMENT entry for variances
    const varianceItems = cc.items.filter((item) => Number(item.varianceQty) !== 0);

    if (varianceItems.length > 0) {
      const stockItems = varianceItems.map((item, index) => {
        const diff = Number(item.varianceQty);
        const qty = Math.abs(diff);
        const valRate = Number(item.product.costPrice);

        return {
          productId: item.productId,
          qty,
          fromWarehouseId: diff < 0 ? cc.warehouseId : null,
          toWarehouseId: diff > 0 ? cc.warehouseId : null,
          valuationRate: valRate,
          sortOrder: index,
        };
      });

      // Submit Stock Entry
      const entry = await this.createStockEntry(tenantId, 'org-system-default', userId, {
        type: 'STOCK_ADJUSTMENT',
        purpose: 'STOCK_ADJUSTMENT',
        remarks: `Auto variance adjustment for Cycle Count #${cc.id}`,
        fromWarehouseId: cc.warehouseId,
        items: stockItems,
      });

      await this.submitStockEntry(tenantId, entry.id, userId);
    }

    return prisma.cycleCount.update({
      where: { id: cc.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
      include: { items: true },
    });
  }

  // ─── CYCLE COUNT SCHEDULES ──────────────────────────

  async getCycleCountSchedules(tenantId: string, params: PaginationParams & { warehouseId?: string; active?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.active !== undefined) where.active = params.active === 'true';

    const { skip, take } = buildPaginationValues(params);
    const [schedules, total] = await Promise.all([
      prisma.cycleCountSchedule.findMany({ where, skip, take, orderBy: { nextDueDate: 'asc' } }),
      prisma.cycleCountSchedule.count({ where }),
    ]);
    return paginatedResult(schedules, total, params);
  }

  async getDueCycleCountSchedules(tenantId: string) {
    return prisma.cycleCountSchedule.findMany({
      where: { tenantId, active: true, nextDueDate: { lte: new Date() } },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async createCycleCountSchedule(tenantId: string, dto: CreateCycleCountScheduleInput) {
    return prisma.cycleCountSchedule.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        zone: dto.zone,
        binScope: dto.binScope,
        frequency: dto.frequency,
        blindCount: dto.blindCount,
        nextDueDate: new Date(dto.nextDueDate),
        active: dto.active,
      },
    });
  }

  async updateCycleCountSchedule(tenantId: string, id: string, dto: UpdateCycleCountScheduleInput) {
    const existing = await prisma.cycleCountSchedule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cycle count schedule not found');

    const data: any = { ...dto };
    if (dto.nextDueDate) data.nextDueDate = new Date(dto.nextDueDate);

    return prisma.cycleCountSchedule.update({ where: { id }, data });
  }

  async deleteCycleCountSchedule(tenantId: string, id: string) {
    const existing = await prisma.cycleCountSchedule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cycle count schedule not found');
    await prisma.cycleCountSchedule.delete({ where: { id } });
    return { success: true };
  }

  /** Rolls a completed schedule's due date forward by its frequency, so recurring counts keep firing without manual re-entry. */
  async rollForwardCycleCountSchedule(tenantId: string, id: string) {
    const schedule = await prisma.cycleCountSchedule.findFirst({ where: { id, tenantId } });
    if (!schedule) throw new NotFoundException('Cycle count schedule not found');

    const days = schedule.frequency === 'WEEKLY' ? 7 : schedule.frequency === 'QUARTERLY' ? 90 : 30;
    const nextDueDate = new Date(schedule.nextDueDate.getTime() + days * 24 * 60 * 60 * 1000);

    return prisma.cycleCountSchedule.update({ where: { id }, data: { nextDueDate } });
  }

  /** Perpetual-inventory accuracy KPI: % of counted items with zero variance, over a trailing window. */
  async getCycleCountAccuracy(tenantId: string, warehouseId?: string, sinceDays = 90) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const where: any = { tenantId, status: { in: ['COMPLETED', 'APPROVED'] }, completedAt: { gte: since } };
    if (warehouseId) where.warehouseId = warehouseId;

    const counts = await prisma.cycleCount.findMany({
      where,
      include: { items: true },
    });

    let totalItems = 0;
    let accurateItems = 0;
    let totalAbsVariance = 0;

    for (const cc of counts) {
      for (const item of cc.items) {
        if (item.countedQty === null) continue;
        totalItems += 1;
        const variance = Number(item.varianceQty ?? 0);
        totalAbsVariance += Math.abs(variance);
        if (variance === 0) accurateItems += 1;
      }
    }

    return {
      warehouseId: warehouseId ?? null,
      windowDays: sinceDays,
      sessionsCounted: counts.length,
      itemsCounted: totalItems,
      accurateItems,
      accuracyRate: totalItems > 0 ? Number(((accurateItems / totalItems) * 100).toFixed(2)) : null,
      totalAbsoluteVariance: totalAbsVariance,
    };
  }

  // ─── LICENSE PLATES (pallet/container tracking) ─────

  async getLicensePlates(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;

    const { skip, take } = buildPaginationValues(params);
    const [plates, total] = await Promise.all([
      prisma.licensePlate.findMany({
        where,
        include: { items: true, bin: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.licensePlate.count({ where }),
    ]);
    return paginatedResult(plates, total, params);
  }

  async getLicensePlateById(tenantId: string, id: string) {
    const plate = await prisma.licensePlate.findFirst({
      where: { id, tenantId },
      include: { items: { include: { inventoryItem: true, lotBatch: true, serialNumber: true } }, bin: true, warehouse: true },
    });
    if (!plate) throw new NotFoundException('License plate not found');
    return plate;
  }

  async createLicensePlate(tenantId: string, dto: CreateLicensePlateInput) {
    const existing = await prisma.licensePlate.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('A license plate with this code already exists');

    return prisma.licensePlate.create({
      data: {
        tenantId,
        code: dto.code,
        warehouseId: dto.warehouseId,
        binId: dto.binId,
        status: 'OPEN',
      },
    });
  }

  async addLicensePlateItem(tenantId: string, licensePlateId: string, dto: AddLicensePlateItemInput) {
    const plate = await prisma.licensePlate.findFirst({ where: { id: licensePlateId, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    if (plate.status !== 'OPEN') throw new BadRequestException('Cannot add items to a closed or consumed license plate');

    await prisma.licensePlateItem.create({
      data: {
        tenantId,
        licensePlateId,
        inventoryItemId: dto.inventoryItemId,
        quantity: new Prisma.Decimal(dto.quantity),
        lotBatchId: dto.lotBatchId,
        serialNumberId: dto.serialNumberId,
      },
    });
    return this.getLicensePlateById(tenantId, licensePlateId);
  }

  async moveLicensePlate(tenantId: string, id: string, dto: MoveLicensePlateInput) {
    const plate = await prisma.licensePlate.findFirst({ where: { id, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    if (plate.status === 'CONSUMED') throw new BadRequestException('Cannot move a consumed license plate');

    return prisma.licensePlate.update({ where: { id }, data: { binId: dto.binId } });
  }

  async closeLicensePlate(tenantId: string, id: string) {
    const plate = await prisma.licensePlate.findFirst({ where: { id, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    if (plate.status !== 'OPEN') throw new BadRequestException('License plate is not open');

    return prisma.licensePlate.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date() } });
  }

  // ─── DIRECTED PUT-AWAY TASKS ─────────────────────────

  async getPutawayTasks(tenantId: string, params: PaginationParams & { status?: string; stockEntryId?: string } = {}) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.stockEntryId) where.stockEntryId = params.stockEntryId;

    const { skip, take } = buildPaginationValues(params);
    const [tasks, total] = await Promise.all([
      prisma.putawayTask.findMany({
        where,
        include: { inventoryItem: { include: { product: true } }, suggestedBin: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.putawayTask.count({ where }),
    ]);
    return paginatedResult(tasks, total, params);
  }

  /** Zone-based directed put-away: suggests the bin in the item's warehouse with the most free capacity, to minimize travel distance. */
  async suggestPutawayBin(tenantId: string, inventoryItemId: string) {
    const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, tenantId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const bins = await prisma.binLocation.findMany({
      where: { tenantId, warehouseId: item.warehouseId, isActive: true },
      include: { _count: { select: { inventoryBins: true } } },
    });
    if (bins.length === 0) return null;

    bins.sort((a, b) => {
      const aFree = (a.capacity ?? Infinity) === Infinity ? Infinity : Number(a.capacity) - a._count.inventoryBins;
      const bFree = (b.capacity ?? Infinity) === Infinity ? Infinity : Number(b.capacity) - b._count.inventoryBins;
      return bFree - aFree;
    });

    return bins[0];
  }

  async createPutawayTask(tenantId: string, dto: CreatePutawayTaskInput) {
    let suggestedBinId = dto.suggestedBinId ?? null;
    if (!suggestedBinId) {
      const suggestion = await this.suggestPutawayBin(tenantId, dto.inventoryItemId);
      suggestedBinId = suggestion?.id ?? null;
    }

    return prisma.putawayTask.create({
      data: {
        tenantId,
        stockEntryId: dto.stockEntryId,
        inventoryItemId: dto.inventoryItemId,
        quantity: new Prisma.Decimal(dto.quantity),
        suggestedBinId,
        status: 'PENDING',
      },
      include: { suggestedBin: true },
    });
  }

  async completePutawayTask(tenantId: string, id: string, _dto: CompletePutawayTaskInput) {
    const task = await prisma.putawayTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Putaway task not found');
    if (task.status === 'COMPLETE') throw new BadRequestException('Putaway task already completed');

    return prisma.putawayTask.update({
      where: { id },
      data: { status: 'COMPLETE', completedAt: new Date() },
    });
  }

  // ─── QUALITY INSPECTIONS ────────────────────────────

  async getQAInspections(tenantId: string, params: PaginationParams & { status?: string } = {}) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.search) {
      where.inspectionNumber = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [inspections, total] = await Promise.all([
      prisma.qualityInspection.findMany({
        where,
        include: { product: true, checkpoints: true },
        skip,
        take,
        orderBy: { inspectionDate: 'desc' },
      }),
      prisma.qualityInspection.count({ where }),
    ]);

    return paginatedResult(inspections, total, params);
  }

  async getQAInspectionById(tenantId: string, id: string) {
    const qa = await prisma.qualityInspection.findFirst({
      where: { id, tenantId },
      include: { product: true, checkpoints: true },
    });
    if (!qa) throw new NotFoundException('QA inspection not found');
    return qa;
  }

  async createQAInspection(tenantId: string, orgId: string, userId: string, dto: CreateQAInspectionInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.qualityInspection.count({ where: { tenantId } });
    const inspectionNumber = `QA-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const cps = dto.checkpoints.map((cp) => ({
      tenantId,
      parameter: cp.parameter,
      criteria: cp.criteria,
      sortOrder: cp.sortOrder,
    }));

    return prisma.qualityInspection.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        inspectionNumber,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        inspectedQty: new Prisma.Decimal(dto.inspectedQty),
        inspectedBy: dto.inspectedBy || userId,
        remarks: dto.remarks,
        createdBy: userId,
        status: 'PENDING',
        checkpoints: {
          create: cps,
        },
      },
      include: { checkpoints: true },
    });
  }

  async submitQAInspection(tenantId: string, id: string, _userId: string, dto: SubmitQAInspectionInput) {
    const qa = await prisma.qualityInspection.findFirst({
      where: { id, tenantId, status: 'PENDING' },
      include: { checkpoints: true },
    });
    if (!qa) throw new NotFoundException('Pending QA inspection not found');

    await prisma.$transaction(async (tx) => {
      // Update checkpoints
      for (const cp of dto.checkpoints) {
        await tx.qAInspectionCheckpoint.update({
          where: { id: cp.id },
          data: {
            result: cp.result,
            observedValue: cp.observedValue,
            remarks: cp.remarks,
          },
        });
      }

      // Update parent inspection status
      await tx.qualityInspection.update({
        where: { id: qa.id },
        data: {
          status: dto.status,
          disposition: dto.disposition,
          acceptedQty: new Prisma.Decimal(dto.acceptedQty),
          rejectedQty: new Prisma.Decimal(dto.rejectedQty),
          remarks: dto.remarks,
          inspectedDate: new Date(),
        },
      });
    });

    return this.getQAInspectionById(tenantId, id);
  }

  // ─── REORDER RULES ──────────────────────────────────

  async getReorderRules(tenantId: string, params: PaginationParams = {}) {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);

    const [rules, total] = await Promise.all([
      prisma.reorderRule.findMany({
        where,
        include: { product: true },
        skip,
        take,
      }),
      prisma.reorderRule.count({ where }),
    ]);

    return paginatedResult(rules, total, params);
  }

  async createReorderRule(tenantId: string, dto: CreateReorderRuleInput) {
    return prisma.reorderRule.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        minQty: new Prisma.Decimal(dto.minQty),
        maxQty: dto.maxQty ? new Prisma.Decimal(dto.maxQty) : null,
        reorderQty: new Prisma.Decimal(dto.reorderQty),
        leadTimeDays: dto.leadTimeDays,
        preferredVendorId: dto.preferredVendorId,
        autoCreatePO: dto.autoCreatePO,
        isActive: dto.isActive,
      },
    });
  }

  async updateReorderRule(tenantId: string, id: string, dto: any) {
    const rule = await prisma.reorderRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Reorder rule not found');

    const updateData: any = {
      isActive: dto.isActive,
      autoCreatePO: dto.autoCreatePO,
      leadTimeDays: dto.leadTimeDays,
      preferredVendorId: dto.preferredVendorId,
    };
    if (dto.minQty !== undefined) updateData.minQty = new Prisma.Decimal(dto.minQty);
    if (dto.maxQty !== undefined) updateData.maxQty = dto.maxQty ? new Prisma.Decimal(dto.maxQty) : null;
    if (dto.reorderQty !== undefined) updateData.reorderQty = new Prisma.Decimal(dto.reorderQty);

    return prisma.reorderRule.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteReorderRule(tenantId: string, id: string) {
    const rule = await prisma.reorderRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Reorder rule not found');

    await prisma.reorderRule.delete({ where: { id } });
    return { success: true };
  }

  // ─── STOCK ALERTS ───────────────────────────────────

  async getStockAlerts(tenantId: string, params: PaginationParams & { isResolved?: boolean } = {}) {
    const where: any = { tenantId };
    if (params.isResolved !== undefined) where.isResolved = params.isResolved;

    const { skip, take } = buildPaginationValues(params);

    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockAlert.count({ where }),
    ]);

    return paginatedResult(alerts, total, params);
  }

  async resolveStockAlert(tenantId: string, id: string) {
    const alert = await prisma.stockAlert.findFirst({ where: { id, tenantId } });
    if (!alert) throw new NotFoundException('Stock alert not found');

    return prisma.stockAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  // ─── PRODUCT KITS ───────────────────────────────────

  async getProductKits(tenantId: string, params: PaginationParams = {}) {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);

    const [kits, total] = await Promise.all([
      prisma.productKit.findMany({
        where,
        include: { product: true, components: { include: { product: true } } },
        skip,
        take,
      }),
      prisma.productKit.count({ where }),
    ]);

    return paginatedResult(kits, total, params);
  }

  async getProductKitById(tenantId: string, id: string) {
    const kit = await prisma.productKit.findFirst({
      where: { id, tenantId },
      include: { product: true, components: { include: { product: true } } },
    });
    if (!kit) throw new NotFoundException('Product kit not found');
    return kit;
  }

  async createProductKit(tenantId: string, orgId: string, dto: CreateKitInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const comps = dto.components.map((c) => ({
      tenantId,
      productId: c.productId,
      quantity: new Prisma.Decimal(c.quantity),
      sortOrder: c.sortOrder,
    }));

    return prisma.productKit.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        productId: dto.productId,
        name: dto.name,
        description: dto.description,
        sellPrice: new Prisma.Decimal(dto.sellPrice),
        discount: new Prisma.Decimal(dto.discount),
        isActive: dto.isActive,
        components: {
          create: comps,
        },
      },
      include: { components: true },
    });
  }

  async updateProductKit(tenantId: string, id: string, dto: any) {
    const kit = await prisma.productKit.findFirst({ where: { id, tenantId } });
    if (!kit) throw new NotFoundException('Product kit not found');

    return prisma.productKit.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        sellPrice: dto.sellPrice !== undefined ? new Prisma.Decimal(dto.sellPrice) : undefined,
        discount: dto.discount !== undefined ? new Prisma.Decimal(dto.discount) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteProductKit(tenantId: string, id: string) {
    const kit = await prisma.productKit.findFirst({ where: { id, tenantId } });
    if (!kit) throw new NotFoundException('Product kit not found');

    await prisma.productKit.delete({ where: { id } });
    return { success: true };
  }

  // ─── VALUATION & REPORTS ────────────────────────────

  async getValuationReport(tenantId: string, params: PaginationParams & { warehouseId?: string; method?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    // Fetch products
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: { inventoryItems: { where: params.warehouseId ? { warehouseId: params.warehouseId } : {} } },
    });

    const reportData = [];
    let totalInventoryValue = 0;

    for (const prod of products) {
      let qty = 0;
      for (const item of prod.inventoryItems) {
        qty += Number(item.quantity);
      }

      // Calculate cost based on specified or default costing method
      const method = params.method || prod.costingMethod || 'AVERAGE';
      let unitCost = Number(prod.costPrice);

      if (method === 'FIFO' || method === 'LIFO') {
        // Fetch all ledger entry histories to compute valuation rates
        const ledgers = await prisma.stockLedgerEntry.findMany({
          where: { tenantId, productId: prod.id, ... (params.warehouseId ? { warehouseId: params.warehouseId } : {}) },
          orderBy: { postingDate: method === 'FIFO' ? 'asc' : 'desc' },
        });

        if (ledgers.length > 0) {
          // Average the rate of the last 5 inbound receipts/purchases as fallback/simplified FIFO calculation
          const receipts = ledgers.filter((l) => Number(l.qtyIn) > 0);
          if (receipts.length > 0) {
            const sum = receipts.slice(0, 5).reduce((acc, curr) => acc + Number(curr.valuationRate), 0);
            unitCost = sum / Math.min(receipts.length, 5);
          }
        }
      } else {
        // AVERAGE method: simplified weighted average rate
        const ledger = await prisma.stockLedgerEntry.findFirst({
          where: { tenantId, productId: prod.id, ... (params.warehouseId ? { warehouseId: params.warehouseId } : {}) },
          orderBy: { postingDate: 'desc' },
        });
        if (ledger) {
          unitCost = Number(ledger.valuationRate) || unitCost;
        }
      }

      const totalVal = qty * unitCost;
      totalInventoryValue += totalVal;

      reportData.push({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        quantity: qty,
        unit: prod.unit,
        costingMethod: method,
        unitCost,
        value: totalVal,
      });
    }

    return {
      totalValue: totalInventoryValue,
      products: reportData,
    };
  }

  async getInventoryAging(tenantId: string, params: PaginationParams & { warehouseId?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        inventoryItems: { where: params.warehouseId ? { warehouseId: params.warehouseId } : {} },
        stockLedgerEntries: {
          where: { ... (params.warehouseId ? { warehouseId: params.warehouseId } : {}), qtyIn: { gt: 0 } },
          orderBy: { postingDate: 'desc' },
          take: 1,
        },
      },
    });

    const agingData = products.map((prod) => {
      let qty = 0;
      for (const item of prod.inventoryItems) {
        qty += Number(item.quantity);
      }

      const lastReceipt = prod.stockLedgerEntries[0];
      let daysOld = 0;
      if (lastReceipt) {
        const diffTime = Math.abs(new Date().getTime() - new Date(lastReceipt.postingDate).getTime());
        daysOld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      let category = '0-30 Days';
      if (daysOld > 90) category = '90+ Days';
      else if (daysOld > 60) category = '61-90 Days';
      else if (daysOld > 30) category = '31-60 Days';

      return {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        quantity: qty,
        lastReceiptDate: lastReceipt ? lastReceipt.postingDate : null,
        daysOld,
        agingCategory: category,
      };
    });

    return agingData;
  }
}