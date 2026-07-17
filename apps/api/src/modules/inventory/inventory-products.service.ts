import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateProductInput, UpdateProductInput,
  CreateCategoryInput, UpdateCategoryInput,
  CreateVariantInput,
} from '@unerp/shared';
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  resolveOrgId,
  PaginatedResult,
  PaginationParams,
} from '../../common/utils/pagination.util';

@Injectable()
export class InventoryProductsService {
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
}
