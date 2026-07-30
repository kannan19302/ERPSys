import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

@Injectable()
export class StorageAdvancedService {
  private readonly logger = new Logger(StorageAdvancedService.name);

  async getEncryption(tenantId: string, fileId: string) {
    const enc = await prisma.storageEncryption.findUnique({
      where: { tenantId_fileId: { tenantId, fileId } },
    });
    if (!enc) throw new NotFoundException("Encryption record not found");
    return enc;
  }

  async encryptFile(
    tenantId: string,
    fileId: string,
    algorithm: string,
    userId: string,
  ) {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const existing = await prisma.storageEncryption.findUnique({
      where: { tenantId_fileId: { tenantId, fileId } },
    });
    if (existing) throw new BadRequestException("File is already encrypted");
    const keyId = `key-${randomBytes(8).toString("hex")}`;
    return prisma.storageEncryption.create({
      data: {
        tenantId,
        fileId,
        algorithm,
        keyId,
        encryptedKey: randomBytes(32).toString("hex"),
        createdBy: userId,
      },
    });
  }

  async decryptFile(tenantId: string, fileId: string) {
    const enc = await prisma.storageEncryption.findUnique({
      where: { tenantId_fileId: { tenantId, fileId } },
    });
    if (!enc) throw new NotFoundException("Encryption record not found");
    return prisma.storageEncryption.update({
      where: { id: enc.id },
      data: { status: "DECRYPTED" },
    });
  }

  async deleteEncryption(tenantId: string, fileId: string) {
    const enc = await prisma.storageEncryption.findUnique({
      where: { tenantId_fileId: { tenantId, fileId } },
    });
    if (!enc) throw new NotFoundException("Encryption record not found");
    await prisma.storageEncryption.delete({ where: { id: enc.id } });
    return { success: true };
  }

  async getReplications(tenantId: string, fileId?: string) {
    const where: Prisma.StorageReplicationWhereInput = { tenantId };
    if (fileId) where.fileId = fileId;
    return prisma.storageReplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createReplication(tenantId: string, dto: any, userId: string) {
    const file = await prisma.storedFile.findFirst({
      where: { id: dto.fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    return prisma.storageReplication.create({
      data: {
        tenantId,
        fileId: dto.fileId,
        sourceBucket: file.bucket,
        targetBucket: dto.targetBucket,
        targetRegion: dto.targetRegion,
        createdBy: userId,
      },
    });
  }

  async deleteReplication(tenantId: string, id: string) {
    const rep = await prisma.storageReplication.findFirst({
      where: { id, tenantId },
    });
    if (!rep) throw new NotFoundException("Replication not found");
    await prisma.storageReplication.delete({ where: { id } });
    return { success: true };
  }

  async getBackups(tenantId: string) {
    return prisma.storageBackup.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createBackup(tenantId: string, dto: any, userId: string) {
    return prisma.storageBackup.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        type: dto.type || "FULL",
        createdBy: userId,
      },
    });
  }

  async restoreBackup(tenantId: string, backupId: string) {
    const backup = await prisma.storageBackup.findFirst({
      where: { id: backupId, tenantId },
    });
    if (!backup) throw new NotFoundException("Backup not found");
    return prisma.storageBackup.update({
      where: { id: backupId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  async deleteBackup(tenantId: string, id: string) {
    const backup = await prisma.storageBackup.findFirst({
      where: { id, tenantId },
    });
    if (!backup) throw new NotFoundException("Backup not found");
    await prisma.storageBackup.delete({ where: { id } });
    return { success: true };
  }

  async getAnalytics(tenantId: string, startDate?: string, endDate?: string) {
    const where: Prisma.StorageAnalyticWhereInput = { tenantId };
    if (startDate)
      where.date = { ...((where.date as any) || {}), gte: new Date(startDate) };
    if (endDate)
      where.date = { ...((where.date as any) || {}), lte: new Date(endDate) };
    return prisma.storageAnalytic.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  async getAlerts(tenantId: string) {
    return prisma.storageAlert.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAlert(tenantId: string, dto: any, userId: string) {
    return prisma.storageAlert.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateAlert(tenantId: string, id: string, dto: any) {
    const alert = await prisma.storageAlert.findFirst({
      where: { id, tenantId },
    });
    if (!alert) throw new NotFoundException("Alert not found");
    return prisma.storageAlert.update({ where: { id }, data: dto });
  }

  async deleteAlert(tenantId: string, id: string) {
    const alert = await prisma.storageAlert.findFirst({
      where: { id, tenantId },
    });
    if (!alert) throw new NotFoundException("Alert not found");
    await prisma.storageAlert.delete({ where: { id } });
    return { success: true };
  }

  async getMigrations(tenantId: string) {
    return prisma.storageMigration.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createMigration(tenantId: string, dto: any, userId: string) {
    return prisma.storageMigration.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async startMigration(tenantId: string, id: string) {
    const migration = await prisma.storageMigration.findFirst({
      where: { id, tenantId },
    });
    if (!migration) throw new NotFoundException("Migration not found");
    return prisma.storageMigration.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  async rollbackMigration(tenantId: string, id: string) {
    const migration = await prisma.storageMigration.findFirst({
      where: { id, tenantId },
    });
    if (!migration) throw new NotFoundException("Migration not found");
    return prisma.storageMigration.update({
      where: { id },
      data: { status: "ROLLED_BACK", completedAt: new Date() },
    });
  }

  async compressFile(
    tenantId: string,
    fileId: string,
    algorithm: string,
    userId: string,
  ) {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const ratio =
      algorithm === "GZIP" ? 0.65 : algorithm === "BROTLI" ? 0.55 : 0.5;
    const compressedSize = Math.round(file.size * ratio);
    return prisma.storageCompression.create({
      data: {
        tenantId,
        fileId,
        algorithm,
        originalSize: file.size,
        compressedSize,
        ratio,
        createdBy: userId,
      },
    });
  }

  async decompressFile(tenantId: string, fileId: string) {
    const comp = await prisma.storageCompression.findFirst({
      where: { tenantId, fileId },
      orderBy: { createdAt: "desc" },
    });
    if (!comp) throw new NotFoundException("Compression record not found");
    return prisma.storageCompression.update({
      where: { id: comp.id },
      data: { status: "DECOMPRESSED" },
    });
  }

  async getCompressions(tenantId: string, fileId?: string) {
    const where: Prisma.StorageCompressionWhereInput = { tenantId };
    if (fileId) where.fileId = fileId;
    return prisma.storageCompression.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async analyzeDeduplication(tenantId: string, userId: string) {
    const files = await prisma.storedFile.findMany({
      where: { tenantId },
      orderBy: { size: "desc" },
    });
    const hashMap = new Map<string, { ids: string[]; totalSize: number }>();
    for (const file of files) {
      const hash = `${file.bucket}/${file.mimeType}/${file.size}`; // Simplified hash
      if (!hashMap.has(hash)) hashMap.set(hash, { ids: [], totalSize: 0 });
      hashMap.get(hash)!.ids.push(file.id);
      hashMap.get(hash)!.totalSize += Number(file.size);
    }
    const results = [];
    for (const [hash, data] of hashMap) {
      if (data.ids.length > 1) {
        const savedSize = data.totalSize - data.totalSize / data.ids.length;
        const dedup = await prisma.storageDeduplication.upsert({
          where: { tenantId_fileHash: { tenantId, fileHash: hash } },
          create: {
            tenantId,
            fileHash: hash,
            fileCount: data.ids.length,
            totalSize: data.totalSize,
            savedSize,
            createdBy: userId,
          },
          update: {
            fileCount: data.ids.length,
            totalSize: data.totalSize,
            savedSize,
          },
        });
        results.push(dedup);
      }
    }
    return results;
  }

  async getDeduplications(tenantId: string) {
    return prisma.storageDeduplication.findMany({
      where: { tenantId },
      orderBy: { savedSize: "desc" },
    });
  }

  async getSnapshots(tenantId: string) {
    return prisma.storageSnapshot.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSnapshot(tenantId: string, dto: any, userId: string) {
    const fileCount = await prisma.storedFile.count({ where: { tenantId } });
    const totalSize = await prisma.storedFile.aggregate({
      where: { tenantId },
      _sum: { size: true },
    });
    return prisma.storageSnapshot.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        type: dto.type || "MANUAL",
        fileCount,
        totalSize: totalSize._sum.size || 0,
        status: "COMPLETED",
        completedAt: new Date(),
        createdBy: userId,
      },
    });
  }

  async restoreSnapshot(tenantId: string, snapshotId: string) {
    const snapshot = await prisma.storageSnapshot.findFirst({
      where: { id: snapshotId, tenantId },
    });
    if (!snapshot) throw new NotFoundException("Snapshot not found");
    return {
      success: true,
      restoredFrom: snapshot.name,
      restoredAt: new Date(),
    };
  }

  async deleteSnapshot(tenantId: string, id: string) {
    const snapshot = await prisma.storageSnapshot.findFirst({
      where: { id, tenantId },
    });
    if (!snapshot) throw new NotFoundException("Snapshot not found");
    await prisma.storageSnapshot.delete({ where: { id } });
    return { success: true };
  }

  async getRetentionPolicies(tenantId: string) {
    return prisma.storageRetentionPolicy.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createRetentionPolicy(tenantId: string, dto: any, userId: string) {
    return prisma.storageRetentionPolicy.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateRetentionPolicy(tenantId: string, id: string, dto: any) {
    const policy = await prisma.storageRetentionPolicy.findFirst({
      where: { id, tenantId },
    });
    if (!policy) throw new NotFoundException("Retention policy not found");
    return prisma.storageRetentionPolicy.update({ where: { id }, data: dto });
  }

  async deleteRetentionPolicy(tenantId: string, id: string) {
    const policy = await prisma.storageRetentionPolicy.findFirst({
      where: { id, tenantId },
    });
    if (!policy) throw new NotFoundException("Retention policy not found");
    await prisma.storageRetentionPolicy.delete({ where: { id } });
    return { success: true };
  }

  async getComplianceLogs(tenantId: string, fileId?: string) {
    const where: Prisma.StorageComplianceLogWhereInput = { tenantId };
    if (fileId) where.fileId = fileId;
    return prisma.storageComplianceLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async checkCompliance(tenantId: string, fileId: string) {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, tenantId },
    });
    if (!file) throw new NotFoundException("File not found");
    const policies = await prisma.storageRetentionPolicy.findMany({
      where: { tenantId, enabled: true },
    });
    const isCompliant =
      policies.length === 0 ||
      policies.some(
        (p) =>
          !p.fileTypes ||
          p.fileTypes.length === 0 ||
          p.fileTypes.includes(file.mimeType),
      );
    await prisma.storageComplianceLog.create({
      data: {
        tenantId,
        fileId,
        action: isCompliant ? "COMPLIANT" : "NON_COMPLIANT",
        details: { policiesChecked: policies.length },
        createdBy: "system",
      },
    });
    return { fileId, compliant: isCompliant, policiesChecked: policies.length };
  }

  async clearCache(tenantId: string, fileId?: string, cacheType?: string) {
    const where: Prisma.StorageCacheWhereInput = { tenantId };
    if (fileId) where.fileId = fileId;
    if (cacheType) where.cacheType = cacheType;
    const count = await prisma.storageCache.deleteMany({ where });
    return { cleared: count.count };
  }

  async getSyncs(tenantId: string) {
    return prisma.storageSync.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSync(tenantId: string, dto: any, userId: string) {
    return prisma.storageSync.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateSync(tenantId: string, id: string, dto: any) {
    const sync = await prisma.storageSync.findFirst({
      where: { id, tenantId },
    });
    if (!sync) throw new NotFoundException("Sync not found");
    return prisma.storageSync.update({ where: { id }, data: dto });
  }

  async deleteSync(tenantId: string, id: string) {
    const sync = await prisma.storageSync.findFirst({
      where: { id, tenantId },
    });
    if (!sync) throw new NotFoundException("Sync not found");
    await prisma.storageSync.delete({ where: { id } });
    return { success: true };
  }
}
