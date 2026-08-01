import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CommunicationRealTimeCollabService {
  async getDocuments(
    tenantId: string,
    userId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      OR: [{ ownerId: userId }, { collaborators: { array_contains: userId } }],
    };
    const [data, total] = await Promise.all([
      prisma.collabDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.collabDocument.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getDocument(tenantId: string, id: string) {
    const doc = await prisma.collabDocument.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { versions: { orderBy: { version: "desc" }, take: 10 } },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return doc;
  }

  async createDocument(
    tenantId: string,
    userId: string,
    dto: { title: string; content?: string; collaborators?: string[] },
  ) {
    const doc = await prisma.collabDocument.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content || "",
        ownerId: userId,
        collaborators: dto.collaborators || [],
      },
    });
    await prisma.collabDocumentVersion.create({
      data: {
        tenantId,
        documentId: doc.id,
        version: 1,
        content: dto.content || "",
        authorId: userId,
      },
    });
    return doc;
  }

  async editDocument(
    tenantId: string,
    id: string,
    userId: string,
    dto: { title?: string; content?: string },
  ) {
    const existing = await prisma.collabDocument.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Document not found");
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    data.version = existing.version + 1;
    const doc = await prisma.collabDocument.update({ where: { id }, data });
    await prisma.collabDocumentVersion.create({
      data: {
        tenantId,
        documentId: id,
        version: doc.version,
        content: dto.content || existing.content,
        authorId: userId,
      },
    });
    return doc;
  }

  async deleteDocument(tenantId: string, id: string) {
    const existing = await prisma.collabDocument.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Document not found");
    return prisma.collabDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async lockDocument(tenantId: string, id: string, userId: string) {
    const existing = await prisma.collabDocument.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Document not found");
    if (existing.isLocked && existing.lockedBy !== userId)
      throw new Error("Document is locked by another user");
    return prisma.collabDocument.update({
      where: { id },
      data: {
        isLocked: !existing.isLocked,
        lockedBy: existing.isLocked ? null : userId,
      },
    });
  }

  async getDocumentVersion(
    tenantId: string,
    documentId: string,
    version: number,
  ) {
    const ver = await prisma.collabDocumentVersion.findUnique({
      where: { tenantId_documentId_version: { tenantId, documentId, version } },
    });
    if (!ver) throw new NotFoundException("Version not found");
    return ver;
  }

  async getWhiteboards(tenantId: string, userId: string) {
    const where = {
      tenantId,
      OR: [{ ownerId: userId }, { collaborators: { array_contains: userId } }],
    };
    return prisma.whiteboard.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
  }

  async getWhiteboard(tenantId: string, id: string) {
    const wb = await prisma.whiteboard.findFirst({
      where: { id, tenantId },
      include: { elements: { orderBy: { sortOrder: "asc" } } },
    });
    if (!wb) throw new NotFoundException("Whiteboard not found");
    return wb;
  }

  async createWhiteboard(
    tenantId: string,
    userId: string,
    dto: {
      title: string;
      width?: number;
      height?: number;
      background?: string;
      collaborators?: string[];
    },
  ) {
    return prisma.whiteboard.create({
      data: {
        tenantId,
        title: dto.title,
        width: dto.width || 1920,
        height: dto.height || 1080,
        background: dto.background || "#FFFFFF",
        ownerId: userId,
        collaborators: dto.collaborators || [],
      },
    });
  }

  async addWhiteboardElement(
    tenantId: string,
    whiteboardId: string,
    userId: string,
    dto: { type: string; properties: any; sortOrder?: number },
  ) {
    const existing = await prisma.whiteboard.findFirst({
      where: { id: whiteboardId, tenantId },
    });
    if (!existing) throw new NotFoundException("Whiteboard not found");
    return prisma.whiteboardElement.create({
      data: {
        tenantId,
        whiteboardId,
        type: dto.type,
        properties: dto.properties,
        sortOrder: dto.sortOrder || 0,
        createdBy: userId,
      },
    });
  }

  async updateWhiteboardElement(
    tenantId: string,
    id: string,
    dto: { properties?: any; sortOrder?: number },
  ) {
    const existing = await prisma.whiteboardElement.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Element not found");
    return prisma.whiteboardElement.update({ where: { id }, data: dto });
  }

  async deleteWhiteboardElement(tenantId: string, id: string) {
    const existing = await prisma.whiteboardElement.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Element not found");
    return prisma.whiteboardElement.delete({ where: { id } });
  }

  async collaborateCoBrowse(
    tenantId: string,
    userId: string,
    sessionId: string,
  ) {
    return {
      message: "Co-browsing session active",
      tenantId,
      userId,
      sessionId,
    };
  }

  async getCollabDashboard(tenantId: string, userId: string) {
    const [myDocuments, myWhiteboards, totalVersions] = await Promise.all([
      prisma.collabDocument.count({
        where: { tenantId, ownerId: userId, deletedAt: null },
      }),
      prisma.whiteboard.count({ where: { tenantId, ownerId: userId } }),
      prisma.collabDocumentVersion.count({ where: { tenantId } }),
    ]);
    return { myDocuments, myWhiteboards, totalVersions };
  }
}
