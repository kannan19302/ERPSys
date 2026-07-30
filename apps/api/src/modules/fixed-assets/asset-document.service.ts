import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetDocumentService {
  async getDocuments(tenantId: string, assetId: string, documentType?: string) {
    const where: Prisma.FixedAssetDocumentWhereInput = { tenantId, assetId };
    if (documentType) where.documentType = documentType;
    return prisma.fixedAssetDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async uploadDocument(
    tenantId: string,
    assetId: string,
    dto: {
      documentType: string;
      title: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      uploadedBy?: string;
    },
  ) {
    return prisma.fixedAssetDocument.create({
      data: { tenantId, assetId, ...dto },
    });
  }

  async deleteDocument(tenantId: string, id: string) {
    const doc = await prisma.fixedAssetDocument.findFirst({
      where: { tenantId, id },
    });
    if (!doc) throw new NotFoundException("Document not found");
    await prisma.fixedAssetDocument.delete({ where: { id } });
    return { success: true };
  }
}
