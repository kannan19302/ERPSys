import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierCertificationService {
  async list(tenantId: string, opts: { page?: number; limit?: number; vendorId?: string; status?: string; expiryBefore?: string }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SupplierCertificationWhereInput = {
      tenantId,
      ...(opts.vendorId ? { vendorId: opts.vendorId } : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.expiryBefore ? { expiryDate: { lte: new Date(opts.expiryBefore) } } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.supplierCertification.findMany({ where, orderBy: { expiryDate: "asc" }, skip, take: limit, include: { vendor: { select: { id: true, name: true } } } }),
      prisma.supplierCertification.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const cert = await prisma.supplierCertification.findFirst({ where: { id, tenantId }, include: { vendor: { select: { id: true, name: true } } } });
    if (!cert) throw new NotFoundException(`Certification not found: ${id}`);
    return cert;
  }

  async create(tenantId: string, dto: Prisma.SupplierCertificationCreateInput) {
    return prisma.supplierCertification.create({ data: { ...dto, tenantId } });
  }

  async update(tenantId: string, id: string, dto: Prisma.SupplierCertificationUpdateInput) {
    await this.getById(tenantId, id);
    return prisma.supplierCertification.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.supplierCertification.update({ where: { id }, data: { status: "REVOKED" } });
  }

  async getExpiringCertifications(tenantId: string, days: number) {
    const target = new Date(Date.now() + days * 86400000);
    return prisma.supplierCertification.findMany({ where: { tenantId, status: "ACTIVE", expiryDate: { lte: target } }, include: { vendor: { select: { id: true, name: true } } } });
  }

  async renewCertification(tenantId: string, id: string, dto: { issueDate: string; expiryDate: string; certificateNumber: string }) {
    const cert = await this.getById(tenantId, id);
    return prisma.$transaction(async (tx) => {
      await tx.supplierCertification.update({ where: { id }, data: { status: "EXPIRED" } });
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = cert;
      return tx.supplierCertification.create({ data: { ...rest, tenantId, status: "ACTIVE", issueDate: new Date(dto.issueDate), expiryDate: new Date(dto.expiryDate), certificateNumber: dto.certificateNumber } });
    });
  }
}
