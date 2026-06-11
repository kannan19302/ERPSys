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
}
