import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class DocumentsAdvancedService {
  private readonly logger = new Logger(DocumentsAdvancedService.name);

  async getAnnotations(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    return prisma.documentAnnotation.findMany({
      where: { tenantId, documentId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createAnnotation(tenantId: string, dto: any, userId: string) {
    await this.ensureDocument(tenantId, dto.documentId);
    return prisma.documentAnnotation.create({
      data: { ...dto, tenantId, createdBy: userId },
    });
  }

  async updateAnnotation(tenantId: string, id: string, dto: any) {
    const annotation = await prisma.documentAnnotation.findFirst({
      where: { id, tenantId },
    });
    if (!annotation) throw new NotFoundException("Annotation not found");
    return prisma.documentAnnotation.update({ where: { id }, data: dto });
  }

  async deleteAnnotation(tenantId: string, id: string) {
    const annotation = await prisma.documentAnnotation.findFirst({
      where: { id, tenantId },
    });
    if (!annotation) throw new NotFoundException("Annotation not found");
    await prisma.documentAnnotation.delete({ where: { id } });
    return { success: true };
  }

  async getComments(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    return prisma.documentComment.findMany({
      where: { tenantId, documentId, parentId: null },
      include: { replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async createComment(tenantId: string, dto: any, userId: string) {
    await this.ensureDocument(tenantId, dto.documentId);
    if (dto.parentId) {
      const parent = await prisma.documentComment.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) throw new BadRequestException("Parent comment not found");
    }
    return prisma.documentComment.create({
      data: { ...dto, tenantId, createdBy: userId },
    });
  }

  async updateComment(tenantId: string, id: string, dto: any, userId: string) {
    const comment = await prisma.documentComment.findFirst({
      where: { id, tenantId },
    });
    if (!comment) throw new NotFoundException("Comment not found");
    const data: any = {};
    if (dto.content !== undefined) {
      data.content = dto.content;
      data.editedAt = new Date();
    }
    if (dto.resolved !== undefined) data.resolved = dto.resolved;
    return prisma.documentComment.update({ where: { id }, data });
  }

  async deleteComment(tenantId: string, id: string) {
    const comment = await prisma.documentComment.findFirst({
      where: { id, tenantId },
    });
    if (!comment) throw new NotFoundException("Comment not found");
    await prisma.documentComment.delete({ where: { id } });
    return { success: true };
  }

  async getTags(tenantId: string) {
    return prisma.documentTag.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createTag(tenantId: string, dto: any, userId: string) {
    return prisma.documentTag.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateTag(tenantId: string, id: string, dto: any) {
    const tag = await prisma.documentTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException("Tag not found");
    return prisma.documentTag.update({ where: { id }, data: dto });
  }

  async deleteTag(tenantId: string, id: string) {
    const tag = await prisma.documentTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException("Tag not found");
    await prisma.documentTagAssignment.deleteMany({ where: { tagId: id } });
    await prisma.documentTag.delete({ where: { id } });
    return { success: true };
  }

  async assignTags(tenantId: string, documentId: string, tagIds: string[]) {
    await this.ensureDocument(tenantId, documentId);
    const existing = await prisma.documentTagAssignment.findMany({
      where: { tenantId, documentId },
    });
    const existingTagIds = existing.map((e) => e.tagId);
    const toAdd = tagIds.filter((t) => !existingTagIds.includes(t));
    for (const tagId of toAdd) {
      await prisma.documentTagAssignment.create({
        data: { tenantId, tagId, documentId },
      });
    }
    const toRemove = existingTagIds.filter((t) => !tagIds.includes(t));
    if (toRemove.length > 0) {
      await prisma.documentTagAssignment.deleteMany({
        where: { tenantId, documentId, tagId: { in: toRemove } },
      });
    }
    return prisma.documentTag.findMany({
      where: { id: { in: tagIds }, tenantId },
    });
  }

  async getDocumentTags(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    const assignments = await prisma.documentTagAssignment.findMany({
      where: { tenantId, documentId },
      include: { tag: true },
    });
    return assignments.map((a) => a.tag);
  }

  async lockDocument(
    tenantId: string,
    documentId: string,
    dto: any,
    userId: string,
  ) {
    await this.ensureDocument(tenantId, documentId);
    const existing = await prisma.documentLock.findUnique({
      where: { documentId },
    });
    if (existing) throw new BadRequestException("Document is already locked");
    return prisma.documentLock.create({
      data: {
        tenantId,
        documentId,
        lockedBy: userId,
        reason: dto.reason || "Manual lock",
      },
    });
  }

  async unlockDocument(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });
    if (!lock) throw new BadRequestException("Document is not locked");
    await prisma.documentLock.delete({ where: { documentId } });
    return { success: true };
  }

  async getLockStatus(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    return prisma.documentLock.findUnique({ where: { documentId } });
  }

  async getDocumentWorkflows(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    return prisma.documentWorkflow.findMany({
      where: { tenantId, documentId },
      orderBy: { initiatedAt: "desc" },
    });
  }

  async initiateWorkflow(
    tenantId: string,
    documentId: string,
    workflowId: string,
    userId: string,
  ) {
    await this.ensureDocument(tenantId, documentId);
    return prisma.documentWorkflow.create({
      data: {
        tenantId,
        documentId,
        workflowId,
        status: "PENDING",
        initiatedBy: userId,
      },
    });
  }

  async updateWorkflowStatus(tenantId: string, id: string, status: string) {
    const wf = await prisma.documentWorkflow.findFirst({
      where: { id, tenantId },
    });
    if (!wf) throw new NotFoundException("Document workflow not found");
    const data: any = { status };
    if (status === "APPROVED" || status === "REJECTED")
      data.completedAt = new Date();
    return prisma.documentWorkflow.update({ where: { id }, data });
  }

  async getExports(tenantId: string, documentId?: string) {
    const where: Prisma.DocumentExportWhereInput = { tenantId };
    if (documentId) where.documentId = documentId;
    return prisma.documentExport.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async exportDocument(
    tenantId: string,
    documentId: string,
    format: string,
    userId: string,
  ) {
    await this.ensureDocument(tenantId, documentId);
    return prisma.documentExport.create({
      data: {
        tenantId,
        documentId,
        format,
        status: "COMPLETED",
        requestedBy: userId,
        fileUrl: `exports/${tenantId}/${documentId}.${format.toLowerCase()}`,
        fileSize: 0,
      },
    });
  }

  async getAuditLogs(tenantId: string, documentId: string, action?: string) {
    await this.ensureDocument(tenantId, documentId);
    const where: Prisma.DocumentAuditLogWhereInput = { tenantId, documentId };
    if (action) where.action = action;
    return prisma.documentAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async logAudit(
    tenantId: string,
    documentId: string,
    action: string,
    actorId: string,
    details?: any,
  ) {
    return prisma.documentAuditLog.create({
      data: { tenantId, documentId, action, actorId, details: details || null },
    });
  }

  async getSmartCollections(tenantId: string) {
    return prisma.documentSmartCollection.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createSmartCollection(tenantId: string, dto: any, userId: string) {
    return prisma.documentSmartCollection.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateSmartCollection(tenantId: string, id: string, dto: any) {
    const col = await prisma.documentSmartCollection.findFirst({
      where: { id, tenantId },
    });
    if (!col) throw new NotFoundException("Smart collection not found");
    return prisma.documentSmartCollection.update({ where: { id }, data: dto });
  }

  async deleteSmartCollection(tenantId: string, id: string) {
    const col = await prisma.documentSmartCollection.findFirst({
      where: { id, tenantId },
    });
    if (!col) throw new NotFoundException("Smart collection not found");
    await prisma.documentSmartCollection.delete({ where: { id } });
    return { success: true };
  }

  async toggleFavorite(tenantId: string, documentId: string, userId: string) {
    await this.ensureDocument(tenantId, documentId);
    const existing = await prisma.documentFavorite.findUnique({
      where: { tenantId_userId_documentId: { tenantId, userId, documentId } },
    });
    if (existing) {
      await prisma.documentFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await prisma.documentFavorite.create({
      data: { tenantId, documentId, userId },
    });
    return { favorited: true };
  }

  async getFavorites(tenantId: string, userId: string) {
    const favorites = await prisma.documentFavorite.findMany({
      where: { tenantId, userId },
      include: {
        document: {
          include: {
            versions: { orderBy: { versionNumber: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return favorites.map((f) => f.document);
  }

  async trackRecent(tenantId: string, documentId: string, userId: string) {
    await this.ensureDocument(tenantId, documentId);
    const existing = await prisma.documentRecentItem.findUnique({
      where: { tenantId_userId_documentId: { tenantId, userId, documentId } },
    });
    if (existing) {
      return prisma.documentRecentItem.update({
        where: { id: existing.id },
        data: { lastViewed: new Date(), viewCount: { increment: 1 } },
      });
    }
    return prisma.documentRecentItem.create({
      data: { tenantId, documentId, userId },
    });
  }

  async getRecentItems(tenantId: string, userId: string, limit = 20) {
    const items = await prisma.documentRecentItem.findMany({
      where: { tenantId, userId },
      include: {
        document: {
          include: {
            versions: { orderBy: { versionNumber: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { lastViewed: "desc" },
      take: limit,
    });
    return items.map((i) => ({
      ...i.document,
      lastViewed: i.lastViewed,
      viewCount: i.viewCount,
    }));
  }

  async setWatermark(
    tenantId: string,
    documentId: string,
    dto: any,
    userId: string,
  ) {
    await this.ensureDocument(tenantId, documentId);
    const existing = await prisma.documentWatermark.findUnique({
      where: { tenantId_documentId: { tenantId, documentId } },
    });
    if (existing) {
      return prisma.documentWatermark.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return prisma.documentWatermark.create({
      data: { tenantId, documentId, ...dto, createdBy: userId },
    });
  }

  async removeWatermark(tenantId: string, documentId: string) {
    await this.ensureDocument(tenantId, documentId);
    const existing = await prisma.documentWatermark.findUnique({
      where: { tenantId_documentId: { tenantId, documentId } },
    });
    if (!existing) throw new BadRequestException("No watermark set");
    await prisma.documentWatermark.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async mergeDocuments(
    tenantId: string,
    documentIds: string[],
    outputName: string,
    userId: string,
  ) {
    for (const id of documentIds) await this.ensureDocument(tenantId, id);
    const orgId = "org-merged";
    const merged = await prisma.document.create({
      data: { tenantId, orgId, name: outputName, createdBy: userId },
    });
    await prisma.documentExport.create({
      data: {
        tenantId,
        documentId: merged.id,
        format: "PDF",
        status: "COMPLETED",
        requestedBy: userId,
        fileUrl: `merged/${tenantId}/${merged.id}.pdf`,
        fileSize: 0,
      },
    });
    return merged;
  }

  async splitDocument(
    tenantId: string,
    documentId: string,
    pageRanges: any[],
    userId: string,
  ) {
    await this.ensureDocument(tenantId, documentId);
    const orgId = "org-split";
    const results: any[] = [];
    for (const range of pageRanges) {
      const doc = await prisma.document.create({
        data: { tenantId, orgId, name: range.name, createdBy: userId },
      });
      await prisma.documentExport.create({
        data: {
          tenantId,
          documentId: doc.id,
          format: "PDF",
          status: "COMPLETED",
          requestedBy: userId,
          fileUrl: `split/${tenantId}/${doc.id}.pdf`,
          fileSize: 0,
        },
      });
      results.push(doc);
    }
    return results;
  }

  async batchOperation(
    tenantId: string,
    documentIds: string[],
    operation: string,
    params: any,
    userId: string,
  ) {
    const results: any[] = [];
    for (const documentId of documentIds) {
      try {
        await this.ensureDocument(tenantId, documentId);
        switch (operation) {
          case "DELETE":
            await prisma.document.update({
              where: { id: documentId },
              data: { deletedAt: new Date() },
            });
            break;
          case "RESTORE":
            await prisma.document.update({
              where: { id: documentId },
              data: { deletedAt: null },
            });
            break;
          case "EXPORT":
            await this.exportDocument(
              tenantId,
              documentId,
              params?.format || "PDF",
              userId,
            );
            break;
          case "TAG":
            if (params?.tagIds)
              await this.assignTags(tenantId, documentId, params.tagIds);
            break;
          case "LOCK":
            await this.lockDocument(tenantId, documentId, params || {}, userId);
            break;
          case "UNLOCK":
            await this.unlockDocument(tenantId, documentId);
            break;
        }
        results.push({ documentId, success: true });
      } catch (err: any) {
        results.push({ documentId, success: false, error: err.message });
      }
    }
    return results;
  }

  async getAnalytics(tenantId: string) {
    const [
      totalDocs,
      totalVersions,
      annotations,
      comments,
      favorites,
      exportsLog,
    ] = await Promise.all([
      prisma.document.count({ where: { tenantId, deletedAt: null } }),
      prisma.documentVersion.count({ where: { tenantId } }),
      prisma.documentAnnotation.count({ where: { tenantId } }),
      prisma.documentComment.count({ where: { tenantId } }),
      prisma.documentFavorite.count({ where: { tenantId } }),
      prisma.documentExport.count({ where: { tenantId } }),
    ]);
    return {
      totalDocuments: totalDocs,
      totalVersions: totalVersions,
      totalAnnotations: annotations,
      totalComments: comments,
      totalFavorites: favorites,
      totalExports: exportsLog,
    };
  }

  async previewDocument(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException("Document not found");
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
    });
    return {
      id: doc.id,
      name: doc.name,
      mimeType: "application/octet-stream",
      size: latestVersion?.fileSize || 0,
      fileUrl: latestVersion?.fileUrl || null,
    };
  }

  private async ensureDocument(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return doc;
  }
}
