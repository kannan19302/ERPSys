import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class CustomsDocumentService {
  async list(tenantId: string, opts: { page?: number; limit?: number; status?: string; direction?: string; shipmentType?: string; shipmentId?: string }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.CustomsDocumentWhereInput = {
      tenantId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.direction ? { direction: opts.direction } : {}),
      ...(opts.shipmentType ? { shipmentType: opts.shipmentType } : {}),
      ...(opts.shipmentId ? { shipmentId: opts.shipmentId } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.customsDocument.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.customsDocument.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const doc = await prisma.customsDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException(`Customs document not found: ${id}`);
    return doc;
  }

  async create(tenantId: string, dto: Prisma.CustomsDocumentCreateInput) {
    const existing = await prisma.customsDocument.findFirst({ where: { tenantId, docNumber: dto.docNumber } });
    if (existing) throw new BadRequestException(`Document number already exists: ${dto.docNumber}`);
    return prisma.customsDocument.create({ data: { ...dto, tenantId } });
  }

  async update(tenantId: string, id: string, dto: Prisma.CustomsDocumentUpdateInput) {
    await this.getById(tenantId, id);
    return prisma.customsDocument.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.customsDocument.delete({ where: { id } });
  }

  async submit(tenantId: string, id: string) {
    const doc = await this.getById(tenantId, id);
    if (doc.status !== "DRAFT") throw new BadRequestException(`Cannot submit document in status: ${doc.status}`);
    return prisma.customsDocument.update({ where: { id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
  }

  async markCleared(tenantId: string, id: string, dto: { clearedAt: string; dutyAmount: number; taxAmount: number; totalFees: number }) {
    await this.getById(tenantId, id);
    return prisma.customsDocument.update({ where: { id }, data: { status: "CLEARED", clearedAt: new Date(dto.clearedAt), dutyAmount: new Prisma.Decimal(dto.dutyAmount), taxAmount: new Prisma.Decimal(dto.taxAmount), totalFees: new Prisma.Decimal(dto.totalFees) } });
  }
}
