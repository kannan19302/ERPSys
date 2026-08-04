import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

@Injectable()
export class StorageService {
  async getFolders(tenantId: string, parentId?: string) {
    const where: Prisma.StorageFolderWhereInput = {
      tenantId,
      parentId: parentId || null,
    };
    if (parentId) where.parentId = parentId;
    return prisma.storageFolder.findMany({ where, orderBy: { name: "asc" } });
  }

  async createFolder(
    tenantId: string,
    dto: { name: string; parentId?: string },
    userId: string,
  ) {
    const path = dto.parentId
      ? (await this.getFolderPath(tenantId, dto.parentId)) + "/" + dto.name
      : "/" + dto.name;
    const folder = await prisma.storageFolder.create({
      data: {
        tenantId,
        name: dto.name,
        parentId: dto.parentId,
        path,
        createdBy: userId,
      },
    });
    await this.ensureQuota(tenantId);
    await prisma.storageQuota.update({
      where: { tenantId },
      data: { folderCount: { increment: 1 } },
    });
    return folder;
  }

  async updateFolder(tenantId: string, id: string, dto: { name?: string }) {
    const folder = await prisma.storageFolder.findFirst({
      where: { id, tenantId },
    });
    if (!folder) throw new NotFoundException("Folder not found");
    if (dto.name) {
      const parentPath = folder.path.substring(0, folder.path.lastIndexOf("/"));
      dto.name = dto.name;
      return prisma.storageFolder.update({
        where: { id },
        data: { name: dto.name, path: parentPath + "/" + dto.name },
      });
    }
    return folder;
  }

  async deleteFolder(tenantId: string, id: string) {
    const folder = await prisma.storageFolder.findFirst({
      where: { id, tenantId },
    });
    if (!folder) throw new NotFoundException("Folder not found");
    const fileCount = await prisma.storedFile.count({
      where: { folderId: id },
    });
    if (fileCount > 0) throw new BadRequestException("Folder is not empty");
    await prisma.storageFolder.delete({ where: { id } });
    await prisma.storageQuota.update({
      where: { tenantId },
      data: { folderCount: { decrement: 1 } },
    });
    return { success: true };
  }

  async getFiles(tenantId: string, folderId?: string) {
    const where: Prisma.StoredFileWhereInput = { tenantId };
    if (folderId) where.folderId = folderId;
    return prisma.storedFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async registerFile(
    tenantId: string,
    dto: {
      name: string;
      folderId?: string;
      bucket: string;
      fileKey: string;
      size: number;
      mimeType: string;
    },
    userId: string,
  ) {
    if (dto.folderId) {
      const folder = await prisma.storageFolder.findFirst({
        where: { id: dto.folderId, tenantId },
      });
      if (!folder) throw new NotFoundException("Folder not found");
    }
    const file = await prisma.storedFile.create({
      data: {
        tenantId,
        name: dto.name,
        folderId: dto.folderId,
        bucket: dto.bucket,
        fileKey: dto.fileKey,
        size: dto.size,
        mimeType: dto.mimeType,
        createdBy: userId,
      },
    });
    await this.ensureQuota(tenantId);
    await prisma.storageQuota.update({
      where: { tenantId },
      data: {
        storageUsed: { increment: dto.size },
        fileCount: { increment: 1 },
      },
    });
    return file;
  }

  async deleteFile(tenantId: string, id: string) {
    const file = await prisma.storedFile.findFirst({ where: { id, tenantId } });
    if (!file) throw new NotFoundException("File not found");
    await prisma.storedFile.delete({ where: { id } });
    await prisma.storageQuota.update({
      where: { tenantId },
      data: {
        storageUsed: { decrement: file.size },
        fileCount: { decrement: 1 },
      },
    });
    return { success: true };
  }

  async getFileVersions(tenantId: string, fileId: string) {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    return prisma.storageFileVersion.findMany({
      where: { tenantId, fileId },
      orderBy: { version: "desc" },
    });
  }

  async createFileVersion(
    tenantId: string,
    fileId: string,
    dto: { fileKey: string; size: number; mimeType: string },
    userId: string,
  ) {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const lastVersion = await prisma.storageFileVersion.findFirst({
      where: { tenantId, fileId },
      orderBy: { version: "desc" },
    });
    const version = (lastVersion?.version || 0) + 1;
    return prisma.storageFileVersion.create({
      data: {
        tenantId,
        fileId,
        version,
        fileKey: dto.fileKey,
        size: dto.size,
        mimeType: dto.mimeType,
        createdBy: userId,
      },
    });
  }

  async createShareLink(
    tenantId: string,
    dto: {
      fileId: string;
      permission?: string;
      expiresInHours?: number;
      maxDownloads?: number;
    },
    userId: string,
  ) {
    const file = await prisma.storedFile.findFirst({
      where: { id: dto.fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const token = randomBytes(24).toString("hex");
    const expiresAt = dto.expiresInHours
      ? new Date(Date.now() + dto.expiresInHours * 3600000)
      : null;
    return prisma.storageShareLink.create({
      data: {
        tenantId,
        fileId: dto.fileId,
        token,
        permission: dto.permission || "VIEW",
        expiresAt,
        maxDownloads: dto.maxDownloads,
        createdBy: userId,
      },
    });
  }

  async deleteShareLink(tenantId: string, linkId: string) {
    const link = await prisma.storageShareLink.findFirst({
      where: { id: linkId, tenantId },
    });
    if (!link) throw new NotFoundException("Share link not found");
    await prisma.storageShareLink.delete({ where: { id: linkId } });
    return { success: true };
  }

  async getShareLinks(tenantId: string) {
    return prisma.storageShareLink.findMany({
      where: { tenantId },
      include: { tenant: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async getQuota(tenantId: string) {
    let quota = await prisma.storageQuota.findUnique({ where: { tenantId } });
    if (!quota) {
      quota = await prisma.storageQuota.create({ data: { tenantId } });
    }
    return quota;
  }

  async updateQuota(tenantId: string, dto: { storageLimit?: number }) {
    await this.ensureQuota(tenantId);
    return prisma.storageQuota.update({
      where: { tenantId },
      data: { storageLimit: dto.storageLimit },
    });
  }

  async generatePresignedUrl(
    tenantId: string,
    fileId: string,
    expiresSeconds: number,
  ) {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const expiresAt = new Date(Date.now() + expiresSeconds * 1000);
    const token = randomBytes(16).toString("hex");
    return {
      fileId,
      fileName: file.name,
      presignedUrl: `https://s3.amazonaws.com/${file.bucket}/${file.fileKey}?token=${token}&expires=${expiresAt.getTime()}`,
      expiresAt,
    };
  }

  async getGeneratedDocuments(tenantId: string) {
    return prisma.generatedDocument.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async generateDocument(
    tenantId: string,
    dto: { documentId: string; templateId: string; format?: string },
  ) {
    const format = dto.format || "PDF";
    const fileUrl = `https://s3.us-east-1.amazonaws.com/unerp-tenant-${tenantId}/${dto.documentId.toLowerCase()}.${format.toLowerCase()}`;
    return prisma.generatedDocument.create({
      data: {
        tenantId,
        documentId: dto.documentId,
        templateId: dto.templateId,
        format,
        fileUrl,
      },
    });
  }

  async updateLifecyclePolicy(
    tenantId: string,
    dto: { glacierAfterDays: number; purgeAfterDays: number },
  ) {
    return {
      success: true,
      tenantId,
      lifecycleConfig: {
        glacierTransitionDays: dto.glacierAfterDays,
        purgeDays: dto.purgeAfterDays,
        updatedAt: new Date(),
      },
    };
  }

  private async getFolderPath(
    tenantId: string,
    folderId: string,
  ): Promise<string> {
    const folder = await prisma.storageFolder.findFirst({
      where: { id: folderId, tenantId },
    });
    if (!folder) throw new NotFoundException("Folder not found");
    if (folder.parentId) {
      const parentPath = await this.getFolderPath(tenantId, folder.parentId);
      return parentPath + "/" + folder.name;
    }
    return "/" + folder.name;
  }

  private async ensureQuota(tenantId: string) {
    const existing = await prisma.storageQuota.findUnique({
      where: { tenantId },
    });
    if (!existing) await prisma.storageQuota.create({ data: { tenantId } });
  }
}
