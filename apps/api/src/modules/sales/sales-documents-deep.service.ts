import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SalesDocumentsDeepService {
  async getTemplates(tenantId: string, category?: string) {
    const where: any = { tenantId, isActive: true };
    if (category) where.category = category;

    return prisma.salesDocumentTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createTemplate(tenantId: string, dto: any) {
    if (dto.isDefault) {
      await prisma.salesDocumentTemplate.updateMany({
        where: { tenantId, category: dto.category },
        data: { isDefault: false },
      });
    }

    return prisma.salesDocumentTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category || "PROPOSAL",
        content: dto.content,
        variables: dto.variables || null,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async generateDocument(tenantId: string, dto: any) {
    const template = await prisma.salesDocumentTemplate.findFirst({
      where: { id: dto.templateId, tenantId },
    });
    if (!template) throw new NotFoundException("Template not found");

    return prisma.salesDocumentGeneration.create({
      data: {
        tenantId,
        templateId: dto.templateId,
        customerId: dto.customerId || null,
        opportunityId: dto.opportunityId || null,
        title:
          dto.title ||
          `${template.name} - ${new Date().toISOString().slice(0, 10)}`,
        status: "DRAFT",
        documentUrl: dto.documentUrl || null,
        metadata: dto.metadata || null,
        generatedBy: dto.generatedBy || null,
      },
      include: { template: true },
    });
  }

  async getGenerations(tenantId: string, customerId?: string) {
    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;

    return prisma.salesDocumentGeneration.findMany({
      where,
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateGenerationStatus(tenantId: string, id: string, status: string) {
    const gen = await prisma.salesDocumentGeneration.findFirst({
      where: { id, tenantId },
    });
    if (!gen) throw new NotFoundException("Generated document not found");

    const data: any = { status };
    if (status === "SENT") data.sentAt = new Date();
    if (status === "SIGNED") data.signedAt = new Date();

    return prisma.salesDocumentGeneration.update({
      where: { id },
      data,
    });
  }
}
