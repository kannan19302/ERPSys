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
}
