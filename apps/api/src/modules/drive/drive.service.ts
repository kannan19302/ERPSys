import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import type { CreateDriveFolderInput, UpdateDriveFolderInput, CreateDriveCommentInput, CreateDriveShareLinkInput } from '@unerp/shared';

@Injectable()
export class DriveService {
  // ── Folder CRUD ──

  async getFolders(tenantId: string, params: { parentId?: string | null; view?: string; search?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 100;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId, isDeleted: false };

    if (params.view === 'starred') where.isStarred = true;
    if (params.view === 'trash') {
      where.isDeleted = true;
      delete where.isDeleted;
      where.isDeleted = true;
    }
    if (params.parentId !== undefined && params.parentId !== null) {
      where.parentId = params.parentId;
    } else if (!params.view || params.view === 'personal') {
      where.parentId = null;
    }
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.driveFolder.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.driveFolder.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFolder(tenantId: string, id: string) {
    const folder = await prisma.driveFolder.findFirst({ where: { id, tenantId }, include: { children: true, permissions: true } });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async createFolder(tenantId: string, userId: string, dto: CreateDriveFolderInput) {
    return prisma.driveFolder.create({ data: { tenantId, ownerId: userId, ...dto } });
  }

  async updateFolder(tenantId: string, id: string, dto: UpdateDriveFolderInput) {
    const existing = await prisma.driveFolder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Folder not found');
    return prisma.driveFolder.update({ where: { id }, data: dto });
  }

  async deleteFolder(tenantId: string, id: string) {
    const existing = await prisma.driveFolder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Folder not found');
    return prisma.driveFolder.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async restoreFolder(tenantId: string, id: string) {
    const existing = await prisma.driveFolder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Folder not found');
    return prisma.driveFolder.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
  }

  async starFolder(tenantId: string, id: string) {
    const existing = await prisma.driveFolder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Folder not found');
    return prisma.driveFolder.update({ where: { id }, data: { isStarred: !existing.isStarred } });
  }

  async permanentDeleteFolder(tenantId: string, id: string) {
    const existing = await prisma.driveFolder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Folder not found');
    return prisma.driveFolder.delete({ where: { id } });
  }

  // ── File CRUD ──

  async getFiles(tenantId: string, params: { folderId?: string | null; view?: string; search?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 100;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId, isDeleted: false };

    if (params.view === 'starred') where.isStarred = true;
    if (params.view === 'trash') {
      where.isDeleted = true;
    }
    if (params.folderId !== undefined && params.folderId !== null) {
      where.folderId = params.folderId;
    } else if (!params.view || params.view === 'personal') {
      where.folderId = null;
    }
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.driveFile.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 }, shareLinks: true } }),
      prisma.driveFile.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFile(tenantId: string, id: string) {
    const file = await prisma.driveFile.findFirst({ where: { id, tenantId }, include: { versions: { orderBy: { version: 'desc' } }, comments: { include: { replies: true } }, shareLinks: true } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async createFile(tenantId: string, userId: string, dto: { folderId?: string; name: string; mimeType: string; size: number; storagePath: string; description?: string; metadata?: Record<string, unknown> }) {
    const file = await prisma.driveFile.create({
      data: { tenantId, ownerId: userId, ...dto, currentVersion: 1 },
    });
    await prisma.driveFileVersion.create({
      data: { tenantId, fileId: file.id, version: 1, size: dto.size, storagePath: dto.storagePath, uploadedBy: userId },
    });
    await prisma.driveStorageQuota.upsert({
      where: { tenantId },
      update: { storageUsed: { increment: dto.size }, fileCount: { increment: 1 } },
      create: { tenantId, storageUsed: dto.size, fileCount: 1, folderCount: 0 },
    });
    return file;
  }

  async updateFile(tenantId: string, id: string, dto: { name?: string; description?: string; isStarred?: boolean; metadata?: Record<string, unknown> }) {
    const existing = await prisma.driveFile.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('File not found');
    return prisma.driveFile.update({ where: { id }, data: dto });
  }

  async deleteFile(tenantId: string, id: string) {
    const existing = await prisma.driveFile.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('File not found');
    return prisma.driveFile.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async restoreFile(tenantId: string, id: string) {
    const existing = await prisma.driveFile.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('File not found');
    return prisma.driveFile.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
  }

  async starFile(tenantId: string, id: string) {
    const existing = await prisma.driveFile.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('File not found');
    return prisma.driveFile.update({ where: { id }, data: { isStarred: !existing.isStarred } });
  }

  async permanentDeleteFile(tenantId: string, id: string) {
    const existing = await prisma.driveFile.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('File not found');
    const versions = await prisma.driveFileVersion.findMany({ where: { fileId: id }, select: { size: true } });
    const totalSize = versions.reduce((sum, v) => sum + Number(v.size), 0);
    await prisma.driveFileVersion.deleteMany({ where: { fileId: id } });
    await prisma.driveFile.delete({ where: { id } });
    await prisma.driveStorageQuota.update({
      where: { tenantId },
      data: { storageUsed: { decrement: totalSize }, fileCount: { decrement: 1 } },
    });
    return { success: true };
  }

  // ── File Versions ──

  async createFileVersion(tenantId: string, fileId: string, userId: string, dto: { size: number; storagePath: string; notes?: string }) {
    const file = await prisma.driveFile.findFirst({ where: { id: fileId, tenantId } });
    if (!file) throw new NotFoundException('File not found');
    const newVersion = file.currentVersion + 1;
    const version = await prisma.driveFileVersion.create({
      data: { tenantId, fileId, version: newVersion, size: dto.size, storagePath: dto.storagePath, uploadedBy: userId, notes: dto.notes },
    });
    await prisma.driveFile.update({ where: { id: fileId }, data: { currentVersion: newVersion } });
    await prisma.driveStorageQuota.update({
      where: { tenantId },
      data: { storageUsed: { increment: dto.size } },
    });
    return version;
  }

  // ── Comments ──

  async getComments(tenantId: string, fileId: string) {
    return prisma.driveFileComment.findMany({ where: { tenantId, fileId, parentId: null }, include: { replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
  }

  async createComment(tenantId: string, userId: string, dto: CreateDriveCommentInput) {
    const file = await prisma.driveFile.findFirst({ where: { id: dto.fileId, tenantId } });
    if (!file) throw new NotFoundException('File not found');
    return prisma.driveFileComment.create({ data: { tenantId, fileId: dto.fileId, userId, content: dto.content, parentId: dto.parentId } });
  }

  // ── Share Links ──

  async createShareLink(tenantId: string, userId: string, dto: CreateDriveShareLinkInput) {
    const file = await prisma.driveFile.findFirst({ where: { id: dto.fileId, tenantId } });
    if (!file) throw new NotFoundException('File not found');
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    return prisma.driveShareLink.create({
      data: { tenantId, fileId: dto.fileId, token, permission: dto.permission || 'VIEW', password: dto.password, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null, maxDownloads: dto.maxDownloads, createdBy: userId },
    });
  }

  // ── Storage Quota ──

  async getStorageQuota(tenantId: string) {
    let quota = await prisma.driveStorageQuota.findUnique({ where: { tenantId } });
    if (!quota) {
      quota = await prisma.driveStorageQuota.create({ data: { tenantId } });
    }
    return quota;
  }

  // ── Activity ──

  async logActivity(tenantId: string, userId: string, action: string, entity: { type?: string; id?: string; name?: string }, details?: Record<string, unknown>) {
    return prisma.driveActivity.create({
      data: { tenantId, userId, action, entityType: entity.type, entityId: entity.id, entityName: entity.name, details },
    });
  }

  async getRecentActivity(tenantId: string) {
    return prisma.driveActivity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  // ── Search ──

  async search(tenantId: string, query: string) {
    const [folders, files] = await Promise.all([
      prisma.driveFolder.findMany({ where: { tenantId, isDeleted: false, name: { contains: query, mode: 'insensitive' } }, take: 20 }),
      prisma.driveFile.findMany({ where: { tenantId, isDeleted: false, name: { contains: query, mode: 'insensitive' } }, take: 20 }),
    ]);
    return { folders, files };
  }
}
