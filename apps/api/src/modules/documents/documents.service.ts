import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class DocumentsService {
  async getFolders(tenantId: string) {
    return prisma.folder.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(
    tenantId: string,
    orgId: string,
    dto: { name: string; parentId?: string },
    createdBy: string
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.folder.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        parentId: dto.parentId || null,
        createdBy,
      },
    });
  }

  async getDocuments(tenantId: string, folderId?: string) {
    return prisma.document.findMany({
      where: {
        tenantId,
        folderId: folderId || null,
        deletedAt: null,
      },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        signatures: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createDocument(
    tenantId: string,
    orgId: string,
    dto: { name: string; folderId?: string; templateId?: string; fileUrl?: string; fileSize?: number },
    createdBy: string
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          name: dto.name,
          folderId: dto.folderId || null,
          templateId: dto.templateId || null,
          signatureStatus: 'NONE',
          createdBy,
        },
      });

      if (dto.fileUrl) {
        await tx.documentVersion.create({
          data: {
            tenantId,
            documentId: doc.id,
            versionNumber: 1,
            fileUrl: dto.fileUrl,
            fileSize: dto.fileSize || 0,
            createdBy,
          },
        });
      }

      return tx.document.findUnique({
        where: { id: doc.id },
        include: { versions: true, signatures: true },
      });
    });
  }

  async addVersion(
    tenantId: string,
    documentId: string,
    dto: { fileUrl: string; fileSize: number },
    createdBy: string
  ) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    return prisma.documentVersion.create({
      data: {
        tenantId,
        documentId,
        versionNumber: nextVersionNumber,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        createdBy,
      },
    });
  }

  async getTemplates(tenantId: string) {
    return prisma.documentTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createTemplate(
    tenantId: string,
    orgId: string,
    dto: { name: string; content: string },
    createdBy: string
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.documentTemplate.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        content: dto.content,
        createdBy,
      },
    });
  }

  async requestSignature(
    tenantId: string,
    documentId: string,
    dto: { signerEmail: string }
  ) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    await prisma.document.update({
      where: { id: documentId },
      data: { signatureStatus: 'PENDING' },
    });

    return prisma.signature.create({
      data: {
        tenantId,
        documentId,
        signerEmail: dto.signerEmail,
        status: 'PENDING',
      },
    });
  }

  async signDocument(
    tenantId: string,
    documentId: string,
    signatureId: string,
    dto: { signatureData: string; ipAddress?: string }
  ) {
    const sig = await prisma.signature.findFirst({
      where: { id: signatureId, documentId, tenantId },
    });
    if (!sig) throw new NotFoundException('Signature request not found');

    return prisma.$transaction(async (tx) => {
      const updatedSig = await tx.signature.update({
        where: { id: signatureId },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
          signatureData: dto.signatureData,
          ipAddress: dto.ipAddress || '0.0.0.0',
        },
      });

      // Check if all signatures signed
      const remaining = await tx.signature.count({
        where: { documentId, status: 'PENDING' },
      });

      if (remaining === 0) {
        await tx.document.update({
          where: { id: documentId },
          data: { signatureStatus: 'SIGNED' },
        });
      }

      return updatedSig;
    });
  }
}
