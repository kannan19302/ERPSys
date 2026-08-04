import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import * as crypto from "crypto";

@Injectable()
export class DriveDeepService {
  private readonly logger = new Logger(DriveDeepService.name);

  // ── Folder Sharing ──

  async shareFolder(
    tenantId: string,
    folderId: string,
    sharedWithUserId: string,
    permission: string,
  ) {
    const folder = await prisma.driveFolder.findFirst({
      where: { id: folderId, tenantId },
    });
    if (!folder) throw new NotFoundException("Folder not found");
    const existing = await prisma.driveFolderShare.findFirst({
      where: { tenantId, folderId, sharedWithUserId },
    });
    if (existing) {
      return prisma.driveFolderShare.update({
        where: { id: existing.id },
        data: { permission },
      });
    }
    return prisma.driveFolderShare.create({
      data: { tenantId, folderId, sharedWithUserId, permission },
    });
  }

  async removeFolderShare(tenantId: string, folderId: string, shareId: string) {
    const share = await prisma.driveFolderShare.findFirst({
      where: { id: shareId, folderId, tenantId },
    });
    if (!share) throw new NotFoundException("Folder share not found");
    return prisma.driveFolderShare.delete({ where: { id: shareId } });
  }

  async getFolderShares(tenantId: string, folderId: string) {
    return prisma.driveFolderShare.findMany({
      where: { tenantId, folderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSharedWithMe(tenantId: string, userId: string) {
    const shares = await prisma.driveFolderShare.findMany({
      where: { tenantId, sharedWithUserId: userId },
      include: { folder: { select: { id: true, name: true, ownerId: true } } },
      orderBy: { createdAt: "desc" },
    });
    const files = await prisma.driveFile.findMany({
      where: { tenantId, isDeleted: false, ownerId: { not: userId } },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        ownerId: true,
        folderId: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return { folderShares: shares, sharedFiles: files };
  }

  // ── File Preview ──

  async getFilePreview(tenantId: string, fileId: string) {
    const file = await prisma.driveFile.findFirst({
      where: { id: fileId, tenantId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!file) throw new NotFoundException("File not found");
    const previewableTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
    ];
    const isPreviewable = previewableTypes.includes(file.mimeType);
    const latestVersion = file.versions[0];
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      isPreviewable,
      previewUrl: isPreviewable ? file.storagePath : null,
      thumbnailUrl: file.mimeType.startsWith("image/")
        ? file.storagePath
        : null,
      latestVersion: latestVersion
        ? {
            version: latestVersion.version,
            storagePath: latestVersion.storagePath,
          }
        : null,
    };
  }

  // ── Trash / Restore ──

  async trashFile(tenantId: string, fileId: string, deletedBy: string) {
    const file = await prisma.driveFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    if (file.isDeleted)
      throw new BadRequestException("File is already in trash");
    await prisma.driveTrashItem.create({
      data: { tenantId, fileId, originalPath: file.storagePath, deletedBy },
    });
    const updated = await prisma.driveFile.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    await prisma.driveStorageQuota.upsert({
      where: { tenantId },
      update: { trashedSize: { increment: Number(file.size) } },
      create: { tenantId, trashedSize: Number(file.size) },
    });
    return updated;
  }

  async restoreFile(tenantId: string, fileId: string) {
    const file = await prisma.driveFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    if (!file.isDeleted) throw new BadRequestException("File is not in trash");
    await prisma.driveTrashItem.deleteMany({ where: { fileId, tenantId } });
    const updated = await prisma.driveFile.update({
      where: { id: fileId },
      data: { isDeleted: false, deletedAt: null },
    });
    await prisma.driveStorageQuota.upsert({
      where: { tenantId },
      update: { trashedSize: { decrement: Number(file.size) } },
      create: { tenantId },
    });
    return updated;
  }

  async getTrashItems(tenantId: string) {
    return prisma.driveTrashItem.findMany({
      where: { tenantId },
      include: {
        file: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            ownerId: true,
          },
        },
      },
      orderBy: { deletedAt: "desc" },
    });
  }

  async emptyTrash(tenantId: string) {
    const items = await prisma.driveTrashItem.findMany({
      where: { tenantId },
      include: { file: { select: { size: true } } },
    });
    const fileIds = items.map((i) => i.fileId);
    await prisma.driveFile.deleteMany({
      where: { id: { in: fileIds }, tenantId },
    });
    const totalSize = items.reduce((s, i) => s + Number(i.file?.size || 0), 0);
    await prisma.driveTrashItem.deleteMany({ where: { tenantId } });
    await prisma.driveStorageQuota.upsert({
      where: { tenantId },
      update: { trashedSize: { decrement: totalSize } },
      create: { tenantId },
    });
    return { deleted: fileIds.length };
  }

  async autoPurgeTrash(tenantId: string) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldItems = await prisma.driveTrashItem.findMany({
      where: { tenantId, deletedAt: { lte: cutoff } },
    });
    if (oldItems.length === 0) return { purged: 0 };
    const fileIds = oldItems.map((i) => i.fileId);
    await prisma.driveFile.deleteMany({
      where: { id: { in: fileIds }, tenantId },
    });
    await prisma.driveTrashItem.deleteMany({
      where: { tenantId, deletedAt: { lte: cutoff } },
    });
    return { purged: oldItems.length };
  }

  // ── Storage Usage Reports ──

  async getStorageUsage(tenantId: string) {
    const quota = await prisma.driveStorageQuota.findUnique({
      where: { tenantId },
    });
    const files = await prisma.driveFile.findMany({
      where: { tenantId, isDeleted: false },
    });
    const totalSize = files.reduce((s, f) => s + Number(f.size), 0);
    const typeBreakdown = this.computeTypeBreakdown(files);
    const topUsers = await this.computeTopUsers(tenantId);
    return {
      totalSize,
      fileCount: files.length,
      quota: {
        used: quota?.storageUsed || 0,
        limit: quota?.storageLimit || 1073741824,
      },
      trashedSize: quota?.trashedSize || 0,
      typeBreakdown,
      topUsers,
    };
  }

  private computeTypeBreakdown(files: any[]) {
    const map: Record<string, number> = {};
    for (const f of files) {
      const cat = f.mimeType.startsWith("image/")
        ? "images"
        : f.mimeType.startsWith("video/")
          ? "videos"
          : f.mimeType.includes("pdf")
            ? "pdfs"
            : "others";
      map[cat] = (map[cat] || 0) + Number(f.size);
    }
    return map;
  }

  private async computeTopUsers(tenantId: string) {
    const files = await prisma.driveFile.findMany({
      where: { tenantId, isDeleted: false },
    });
    const byUser: Record<string, number> = {};
    for (const f of files) {
      byUser[f.ownerId] = (byUser[f.ownerId] || 0) + Number(f.size);
    }
    return Object.entries(byUser)
      .map(([userId, size]) => ({ userId, size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
  }

  async getStorageUsageByFolder(tenantId: string, folderId?: string) {
    const where: any = { tenantId, isDeleted: false };
    if (folderId) where.folderId = folderId;
    const files = await prisma.driveFile.findMany({
      where,
      select: { id: true, name: true, size: true, mimeType: true },
    });
    const totalSize = files.reduce((s, f) => s + Number(f.size), 0);
    return {
      folderId: folderId || "root",
      fileCount: files.length,
      totalSize,
      files,
    };
  }

  // ── File Tagging ──

  async getTags(tenantId: string) {
    return prisma.driveFileTag.findMany({
      where: { tenantId },
      include: { files: { select: { fileId: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createTag(tenantId: string, dto: { name: string; color?: string }) {
    const existing = await prisma.driveFileTag.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException("Tag with this name already exists");
    return prisma.driveFileTag.create({
      data: { tenantId, name: dto.name, color: dto.color || "#6366f1" },
    });
  }

  async updateTag(
    tenantId: string,
    id: string,
    dto: { name?: string; color?: string },
  ) {
    const tag = await prisma.driveFileTag.findFirst({
      where: { id, tenantId },
    });
    if (!tag) throw new NotFoundException("Tag not found");
    return prisma.driveFileTag.update({ where: { id }, data: dto as any });
  }

  async deleteTag(tenantId: string, id: string) {
    const tag = await prisma.driveFileTag.findFirst({
      where: { id, tenantId },
    });
    if (!tag) throw new NotFoundException("Tag not found");
    await prisma.driveFileTagMapping.deleteMany({ where: { tagId: id } });
    return prisma.driveFileTag.delete({ where: { id } });
  }

  async assignTags(tenantId: string, fileId: string, tagIds: string[]) {
    const file = await prisma.driveFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const existing = await prisma.driveFileTagMapping.findMany({
      where: { fileId },
    });
    const existingTagIds = existing.map((e) => e.tagId);
    const toAdd = tagIds.filter((t) => !existingTagIds.includes(t));
    for (const tagId of toAdd) {
      const tag = await prisma.driveFileTag.findFirst({
        where: { id: tagId, tenantId },
      });
      if (!tag) throw new NotFoundException(`Tag ${tagId} not found`);
      await prisma.driveFileTagMapping.create({ data: { fileId, tagId } });
    }
    const toRemove = existingTagIds.filter((t) => !tagIds.includes(t));
    if (toRemove.length > 0) {
      await prisma.driveFileTagMapping.deleteMany({
        where: { fileId, tagId: { in: toRemove } },
      });
    }
    return this.getFileTags(tenantId, fileId);
  }

  async getFileTags(tenantId: string, fileId: string) {
    const file = await prisma.driveFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const mappings = await prisma.driveFileTagMapping.findMany({
      where: { fileId },
      include: { tag: true },
    });
    return mappings.map((m) => m.tag);
  }

  async getFilesByTag(tenantId: string, tagName: string) {
    const tag = await prisma.driveFileTag.findFirst({
      where: { tenantId, name: tagName },
    });
    if (!tag) return [];
    const mappings = await prisma.driveFileTagMapping.findMany({
      where: { tagId: tag.id },
      include: {
        file: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            createdAt: true,
            ownerId: true,
          },
        },
      },
    });
    return mappings.map((m) => m.file);
  }

  // ── Direct Download Links ──

  async generateDownloadLink(
    tenantId: string,
    fileId: string,
    expiresInHours: number,
  ) {
    const file = await prisma.driveFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const cryptoModule = await import("crypto");
    const token = cryptoModule.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const link = await prisma.driveShareLink.create({
      data: {
        tenantId,
        fileId,
        token,
        permission: "VIEW",
        expiresAt,
        createdBy: "system",
      },
    });
    return {
      url: `/api/drive/download/${token}`,
      token: link.token,
      expiresAt: link.expiresAt,
    };
  }

  async resolveDownloadToken(token: string) {
    const link = await prisma.driveShareLink.findUnique({ where: { token } });
    if (!link)
      throw new NotFoundException("Download link not found or expired");
    if (link.expiresAt && link.expiresAt < new Date())
      throw new BadRequestException("Download link has expired");
    const file = await prisma.driveFile.findFirst({
      where: { id: link.fileId },
    });
    if (!file) throw new NotFoundException("File not found");
    await prisma.driveShareLink.update({
      where: { id: link.id },
      data: { downloadCount: { increment: 1 } },
    });
    return { file, storagePath: file.storagePath, filename: file.name };
  }
}
