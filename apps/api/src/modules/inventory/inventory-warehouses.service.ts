import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@unerp/shared';
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  resolveOrgId,
  PaginationParams,
} from '../../common/utils/pagination.util';

@Injectable()
export class InventoryWarehousesService {
  constructor() {}

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
      include: {
        inventoryItems: { include: { product: true } },
        binLocations: true,
      },
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
}
