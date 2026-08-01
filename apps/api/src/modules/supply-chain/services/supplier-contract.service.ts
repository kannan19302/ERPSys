import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierContractService {
  async list(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      vendorId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SupplierContractWhereInput = {
      tenantId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.vendorId ? { vendorId: opts.vendorId } : {}),
    };
    const orderBy: Prisma.SupplierContractOrderByWithRelationInput = opts.sortBy
      ? { [opts.sortBy]: opts.sortOrder ?? "desc" }
      : { createdAt: "desc" };
    const [data, total] = await Promise.all([
      prisma.supplierContract.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          vendor: { select: { id: true, name: true } },
          lineItems: true,
        },
      }),
      prisma.supplierContract.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const contract = await prisma.supplierContract.findFirst({
      where: { id, tenantId },
      include: {
        lineItems: true,
        vendor: { select: { id: true, name: true } },
      },
    });
    if (!contract)
      throw new NotFoundException(`Supplier contract not found: ${id}`);
    return contract;
  }

  async create(
    tenantId: string,
    dto: Prisma.SupplierContractCreateInput & {
      lineItems?: Prisma.SupplierContractLineItemCreateWithoutContractInput[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supplierContract.findFirst({
        where: { tenantId, contractNumber: dto.contractNumber },
      });
      if (existing)
        throw new BadRequestException(
          `Contract number already exists: ${dto.contractNumber}`,
        );
      const { lineItems, ...contractData } = dto;
      const contract = await tx.supplierContract.create({
        data: {
          ...contractData,
          tenantId,
          lineItems: lineItems
            ? { create: lineItems.map((li) => ({ ...li, tenantId })) }
            : undefined,
        },
        include: { lineItems: true },
      });
      return contract;
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: Prisma.SupplierContractUpdateInput,
  ) {
    await this.getById(tenantId, id);
    return prisma.supplierContract.update({
      where: { id },
      data: dto,
      include: { lineItems: true },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.supplierContract.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async approve(tenantId: string, id: string, userId: string) {
    await this.getById(tenantId, id);
    return prisma.supplierContract.update({
      where: { id },
      data: { status: "ACTIVE", approvedBy: userId, approvedAt: new Date() },
    });
  }

  async renew(tenantId: string, id: string, newEndDate: string) {
    const contract = await this.getById(tenantId, id);
    return prisma.$transaction(async (tx) => {
      await tx.supplierContract.update({
        where: { id },
        data: { status: "RENEWED" },
      });
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = contract;
      return tx.supplierContract.create({
        data: {
          ...rest,
          tenantId,
          contractNumber: `${contract.contractNumber}-R${Date.now()}`,
          status: "DRAFT",
          endDate: new Date(newEndDate),
          approvedBy: null,
          approvedAt: null,
          lineItems: {
            create: contract.lineItems.map((li) => ({
              tenantId,
              description: li.description,
              productId: li.productId,
              itemCode: li.itemCode,
              unitPrice: li.unitPrice,
              quantity: li.quantity,
              uom: li.uom,
              discountPct: li.discountPct,
              totalPrice: li.totalPrice,
              notes: li.notes,
            })),
          },
        } as any,
        include: { lineItems: true },
      });
    });
  }

  async getExpiring(tenantId: string, days: number) {
    const target = new Date(Date.now() + days * 86400000);
    return prisma.supplierContract.findMany({
      where: { tenantId, status: "ACTIVE", endDate: { lte: target } },
      include: {
        vendor: { select: { id: true, name: true } },
        lineItems: true,
      },
    });
  }

  async addLineItem(
    tenantId: string,
    contractId: string,
    dto: Prisma.SupplierContractLineItemCreateWithoutContractInput,
  ) {
    await this.getById(tenantId, contractId);
    return prisma.supplierContractLineItem.create({
      data: { ...dto, tenantId, contractId },
    });
  }

  async removeLineItem(tenantId: string, lineItemId: string) {
    const li = await prisma.supplierContractLineItem.findFirst({
      where: { id: lineItemId, tenantId },
    });
    if (!li) throw new NotFoundException(`Line item not found: ${lineItemId}`);
    return prisma.supplierContractLineItem.delete({
      where: { id: lineItemId },
    });
  }
}
