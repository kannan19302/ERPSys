import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierAssessmentService {
  async list(tenantId: string, opts: { page?: number; limit?: number; vendorId?: string; status?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SupplierAssessmentWhereInput = { tenantId, ...(opts.vendorId ? { vendorId: opts.vendorId } : {}), ...(opts.status ? { status: opts.status } : {}) };
    const orderBy: Prisma.SupplierAssessmentOrderByWithRelationInput = opts.sortBy ? { [opts.sortBy]: opts.sortOrder ?? "desc" } : { createdAt: "desc" };
    const [data, total] = await Promise.all([
      prisma.supplierAssessment.findMany({ where, orderBy, skip, take: limit, include: { vendor: { select: { id: true, name: true } } } }),
      prisma.supplierAssessment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const assessment = await prisma.supplierAssessment.findFirst({ where: { id, tenantId }, include: { vendor: { select: { id: true, name: true } } } });
    if (!assessment) throw new NotFoundException(`Supplier assessment not found: ${id}`);
    return assessment;
  }

  async create(tenantId: string, dto: Prisma.SupplierAssessmentCreateInput) {
    const existing = await prisma.supplierAssessment.findFirst({ where: { tenantId, assessmentNumber: dto.assessmentNumber } });
    if (existing) throw new BadRequestException(`Assessment number already exists: ${dto.assessmentNumber}`);
    return prisma.supplierAssessment.create({ data: { ...dto, tenantId } });
  }

  async update(tenantId: string, id: string, dto: Prisma.SupplierAssessmentUpdateInput) {
    await this.getById(tenantId, id);
    return prisma.supplierAssessment.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.supplierAssessment.update({ where: { id }, data: { status: "CANCELLED" } });
  }

  async complete(tenantId: string, id: string, dto: { score: number; findings: string; recommendations: string; overallRating: string }) {
    const assessment = await this.getById(tenantId, id);
    if (assessment.status === "COMPLETED") throw new BadRequestException("Assessment is already completed");
    if (assessment.status === "CANCELLED") throw new BadRequestException("Cannot complete a cancelled assessment");
    return prisma.supplierAssessment.update({ where: { id }, data: { status: "COMPLETED", score: new Prisma.Decimal(dto.score), findings: dto.findings, recommendations: dto.recommendations, overallRating: dto.overallRating, completedDate: new Date() } });
  }
}
