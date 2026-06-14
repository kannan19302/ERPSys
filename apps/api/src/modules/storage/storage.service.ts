import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class StorageService {
  async getFiles(tenantId: string) {
    return prisma.storedFile.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerFile(
    tenantId: string,
    dto: { name: string; bucket: string; fileKey: string; size: number; mimeType: string },
    userId: string
  ) {
    return prisma.storedFile.create({
      data: {
        tenantId,
        name: dto.name,
        bucket: dto.bucket,
        fileKey: dto.fileKey,
        size: dto.size,
        mimeType: dto.mimeType,
        createdBy: userId,
      },
    });
  }

  async getGeneratedDocuments(tenantId: string) {
    return prisma.generatedDocument.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateDocument(
    tenantId: string,
    dto: { documentId: string; templateId: string; format?: string }
  ) {
    const format = dto.format || 'PDF';
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

  async generatePresignedUrl(tenantId: string, fileId: string, expiresSeconds: number) {
    const file = await prisma.storedFile.findFirst({ where: { id: fileId, tenantId } });
    if (!file) throw new Error('File not found');

    const expiresAt = new Date(Date.now() + expiresSeconds * 1000);
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const presignedUrl = `https://s3.us-east-1.amazonaws.com/${file.bucket}/${file.fileKey}?token=${token}&expires=${expiresAt.getTime()}`;

    return {
      fileId,
      fileName: file.name,
      presignedUrl,
      expiresAt,
    };
  }

  async updateLifecyclePolicy(tenantId: string, dto: { glacierAfterDays: number; purgeAfterDays: number }) {
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
}
