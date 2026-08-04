import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class DocumentsDeepService {
  private readonly logger = new Logger(DocumentsDeepService.name);

  // ── Templates ──

  async getTemplates(tenantId: string) {
    return prisma.documentTemplate.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async getTemplate(tenantId: string, id: string) {
    const tpl = await prisma.documentTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Document template not found");
    return tpl;
  }

  async createTemplate(
    tenantId: string,
    orgId: string,
    dto: {
      name: string;
      category?: string;
      content: string;
      variables?: any[];
    },
    createdBy: string,
  ) {
    return prisma.documentTemplate.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        category: dto.category || null,
        content: dto.content,
        variables: dto.variables || [],
        createdBy,
      },
    });
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      category?: string;
      content?: string;
      variables?: any[];
    },
  ) {
    const tpl = await prisma.documentTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Document template not found");
    return prisma.documentTemplate.update({ where: { id }, data: dto as any });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const tpl = await prisma.documentTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Document template not found");
    return prisma.documentTemplate.delete({ where: { id } });
  }

  async renderTemplate(
    tenantId: string,
    templateId: string,
    values: Record<string, string>,
  ) {
    const tpl = await prisma.documentTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!tpl) throw new NotFoundException("Document template not found");
    let rendered = tpl.content;
    for (const [key, val] of Object.entries(values)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    }
    return { name: tpl.name, content: rendered, templateId: tpl.id };
  }

  // ── Categories ──

  async getCategories(tenantId: string) {
    const all = await prisma.documentCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    });
    return this.buildCategoryTree(all);
  }

  private buildCategoryTree(
    items: any[],
    parentId: string | null = null,
  ): any[] {
    return items
      .filter((c) => c.parentId === parentId)
      .map((c) => ({ ...c, children: this.buildCategoryTree(items, c.id) }));
  }

  async getCategory(tenantId: string, id: string) {
    const cat = await prisma.documentCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Document category not found");
    return cat;
  }

  async createCategory(
    tenantId: string,
    dto: { name: string; parentId?: string; sortOrder?: number },
  ) {
    if (dto.parentId) {
      const parent = await prisma.documentCategory.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) throw new BadRequestException("Parent category not found");
    }
    return prisma.documentCategory.create({
      data: {
        tenantId,
        name: dto.name,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(
    tenantId: string,
    id: string,
    dto: { name?: string; parentId?: string; sortOrder?: number },
  ) {
    const cat = await prisma.documentCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Document category not found");
    if (dto.parentId && dto.parentId === id)
      throw new BadRequestException("Cannot set self as parent");
    return prisma.documentCategory.update({ where: { id }, data: dto as any });
  }

  async deleteCategory(tenantId: string, id: string) {
    const cat = await prisma.documentCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Document category not found");
    const children = await prisma.documentCategory.count({
      where: { parentId: id, tenantId },
    });
    if (children > 0)
      throw new BadRequestException("Cannot delete category with children");
    return prisma.documentCategory.delete({ where: { id } });
  }

  // ── Bulk Upload ──

  async bulkUpload(
    tenantId: string,
    orgId: string,
    files: { name: string; folderId?: string; content?: string }[],
    createdBy: string,
  ) {
    const results: any[] = [];
    for (const file of files) {
      const doc = await prisma.document.create({
        data: {
          tenantId,
          orgId,
          name: file.name,
          folderId: file.folderId || null,
          createdBy,
        },
      });
      if (file.content) {
        await prisma.documentVersion.create({
          data: {
            tenantId,
            documentId: doc.id,
            versionNumber: 1,
            fileUrl: `inline/${doc.id}`,
            fileSize: file.content.length,
            changes: "Bulk upload",
            createdBy,
          },
        });
      }
      results.push(doc);
    }
    return results;
  }

  // ── Approval Routing ──

  async submitForApproval(
    tenantId: string,
    documentId: string,
    approverId: string,
  ) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException("Document not found");
    const existing = await prisma.documentApproval.findFirst({
      where: { documentId, approverId, status: "PENDING", tenantId },
    });
    if (existing)
      throw new BadRequestException("Already pending approval from this user");
    return prisma.documentApproval.create({
      data: { tenantId, documentId, approverId },
    });
  }

  async getApprovals(tenantId: string, documentId?: string) {
    const where: any = { tenantId };
    if (documentId) where.documentId = documentId;
    return prisma.documentApproval.findMany({
      where,
      include: { document: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveOrReject(
    tenantId: string,
    approvalId: string,
    status: "APPROVED" | "REJECTED",
    comment?: string,
  ) {
    const approval = await prisma.documentApproval.findFirst({
      where: { id: approvalId, tenantId },
    });
    if (!approval) throw new NotFoundException("Approval request not found");
    if (approval.status !== "PENDING")
      throw new BadRequestException("Already reviewed");
    return prisma.documentApproval.update({
      where: { id: approvalId },
      data: {
        status,
        comment: comment || null,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
    });
  }

  async getPendingApprovals(tenantId: string, userId: string) {
    return prisma.documentApproval.findMany({
      where: { tenantId, approverId: userId, status: "PENDING" },
      include: {
        document: {
          select: { id: true, name: true, createdBy: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── OCR Placeholder ──

  async processOcr(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return {
      status: "PROCESSED",
      documentId,
      ocrText: "[OCR placeholder — text extraction would run here]",
      processedAt: new Date().toISOString(),
    };
  }

  // ── Version Diff Viewer ──

  async getVersionDiff(
    tenantId: string,
    documentId: string,
    v1Num: number,
    v2Num: number,
  ) {
    const [v1, v2] = await Promise.all([
      prisma.documentVersion.findFirst({
        where: { documentId, versionNumber: v1Num, tenantId },
      }),
      prisma.documentVersion.findFirst({
        where: { documentId, versionNumber: v2Num, tenantId },
      }),
    ]);
    if (!v1) throw new NotFoundException(`Version ${v1Num} not found`);
    if (!v2) throw new NotFoundException(`Version ${v2Num} not found`);
    return {
      version1: {
        versionNumber: v1.versionNumber,
        fileUrl: v1.fileUrl,
        changes: v1.changes,
        createdAt: v1.createdAt,
      },
      version2: {
        versionNumber: v2.versionNumber,
        fileUrl: v2.fileUrl,
        changes: v2.changes,
        createdAt: v2.createdAt,
      },
      diffs: this.computeDiffs(v1.changes || "", v2.changes || ""),
    };
  }

  private computeDiffs(
    changes1: string,
    changes2: string,
  ): { field: string; from: string; to: string }[] {
    if (!changes1 && !changes2) return [];
    return [
      {
        field: "changes",
        from: changes1 || "(empty)",
        to: changes2 || "(empty)",
      },
    ];
  }

  // ── Version history ──

  async getVersions(tenantId: string, documentId: string) {
    return prisma.documentVersion.findMany({
      where: { documentId, tenantId },
      orderBy: { versionNumber: "desc" },
    });
  }
}
