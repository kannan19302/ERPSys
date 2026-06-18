import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateProductInput, UpdateProductInput, CreateWarehouseInput, UpdateWarehouseInput } from '@unerp/shared';
import { Prisma } from '@prisma/client';

import { buildPaginationValues, buildOrderBy, paginatedResult, resolveOrgId, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class InventoryService {
  constructor() { }

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

  // ─── WAREHOUSES ────────────────────────────────────

  async getWarehouses(tenantId: string, params: PaginationParams = {}) {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: { _count: { select: { inventoryItems: true } } },
        skip,
        take,
        orderBy: orderBy as any,
      }),
      prisma.warehouse.count({ where }),
    ]);

    return paginatedResult(warehouses, total, params);
  }

  async getWarehouseById(tenantId: string, id: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: { inventoryItems: { include: { product: true } } },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async createWarehouse(tenantId: string, orgId: string, dto: CreateWarehouseInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const existing = await prisma.warehouse.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Warehouse code ${dto.code} already exists.`);

    return prisma.warehouse.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        code: dto.code,
        address: dto.address || undefined,
        isActive: dto.isActive,
      },
    });
  }

  async updateWarehouse(tenantId: string, id: string, dto: UpdateWarehouseInput) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id, tenantId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    return prisma.warehouse.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address ?? undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteWarehouse(tenantId: string, id: string) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id, tenantId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
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
        ]
      };
    }

    const { skip, take } = buildPaginationValues(params);

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: { product: { select: { id: true, name: true, sku: true, unit: true } }, warehouse: { select: { id: true, name: true } } },
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
}