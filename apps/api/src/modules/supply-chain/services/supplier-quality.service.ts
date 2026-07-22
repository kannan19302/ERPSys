import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierQualityService {
  async list(tenantId: string, opts: { page?: number; limit?: number; vendorId?: string; status?: string; severity?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SupplierNonConformanceWhereInput = { tenantId, ...(opts.vendorId ? { vendorId: opts.vendorId } : {}), ...(opts.status ? { status: opts.status } : {}), ...(opts.severity ? { severity: opts.severity } : {}) };
    const orderBy: Prisma.SupplierNonConformanceOrderByWithRelationInput = opts.sortBy ? { [opts.sortBy]: opts.sortOrder ?? "desc" } : { createdAt: "desc" };
    const [data, total] = await Promise.all([
      prisma.supplierNonConformance.findMany({ where, orderBy, skip, take: limit, include: { vendor: { select: { id: true, name: true } } } }),
      prisma.supplierNonConformance.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const ncr = await prisma.supplierNonConformance.findFirst({ where: { id, tenantId }, include: { vendor: { select: { id: true, name: true } } } });
    if (!ncr) throw new NotFoundException(`Non-conformance not found: ${id}`);
    return ncr;
  }

  async create(tenantId: string, dto: Prisma.SupplierNonConformanceCreateInput) {
    const existing = await prisma.supplierNonConformance.findFirst({ where: { tenantId, ncrNumber: dto.ncrNumber } });
    if (existing) throw new BadRequestException(`NCR number already exists: ${dto.ncrNumber}`);
    return prisma.supplierNonConformance.create({ data: { ...dto, tenantId } });
  }

  async update(tenantId: string, id: string, dto: Prisma.SupplierNonConformanceUpdateInput) {
    await this.getById(tenantId, id);
    return prisma.supplierNonConformance.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.supplierNonConformance.update({ where: { id }, data: { status: "CLOSED" } });
  }

  async raiseCar(tenantId: string, id: string, dto: { rootCause: string; correctiveAction: string; dueDate: string }) {
    const ncr = await this.getById(tenantId, id);
    if (ncr.status === "CLOSED") throw new BadRequestException("Cannot raise CAR on a closed NCR");
    return prisma.supplierNonConformance.update({ where: { id }, data: { status: "CAR_RAISED", rootCause: dto.rootCause, correctiveAction: dto.correctiveAction, dueDate: new Date(dto.dueDate) } });
  }
}
