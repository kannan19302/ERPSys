import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { DocumentStorageClient } from '../../common/integrations/document-storage-client';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update(process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345').digest();

async function streamToBuffer(stream: any): Promise<Buffer> {
  if (stream instanceof Buffer) return stream;
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

@Injectable()
export class DocumentsService implements DocumentStorageClient {
  private readonly logger = new Logger(DocumentsService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
    });
    this.bucketName = process.env.S3_BUCKET || 'unerp-uploads';
    this.ensureBucketExists().catch((err) => {
      this.logger.error(`Failed to initialize MinIO bucket: ${err.message}`);
    });
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch {
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        this.logger.log(`MinIO bucket "${this.bucketName}" created successfully.`);
      } catch (err: any) {
        this.logger.warn(`Could not create bucket: ${err.message}`);
      }
    }
  }

  private encryptBuffer(buffer: Buffer, iv: Buffer): Buffer {
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
  }

  private decryptBuffer(buffer: Buffer, iv: Buffer): Buffer {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    return Buffer.concat([decipher.update(buffer), decipher.final()]);
  }

  async getFolders(tenantId: string, parentId?: string, view?: string, userId?: string) {
    const where: any = { tenantId };

    if (parentId) {
      // Inside a folder hierarchy, view parameter doesn't override parentId child listing
      where.parentId = parentId;
      if (view === 'trash') {
        where.deletedAt = { not: null };
      } else {
        where.deletedAt = null;
      }
    } else {
      // At the root level of the specific view
      if (view === 'trash') {
        where.deletedAt = { not: null };
      } else if (view === 'starred') {
        where.deletedAt = null;
        where.starred = true;
        if (userId) {
          where.OR = [
            { createdBy: userId },
            { shares: { some: { userId } } }
          ];
        }
      } else if (view === 'shared') {
        where.deletedAt = null;
        where.parentId = null; // Only show root-level shared folders
        if (userId) {
          where.shares = { some: { userId } };
        }
      } else {
        // Default 'my-drive' (root personal folder)
        where.deletedAt = null;
        where.parentId = null;
        if (userId) {
          where.createdBy = userId;
        }
      }
    }

    return prisma.folder.findMany({
      where,
      include: { shares: true },
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

  async getDocuments(tenantId: string, folderId?: string, view?: string, userId?: string) {
    const where: any = { tenantId };

    if (folderId) {
      // Inside a folder hierarchy, view parameter doesn't override folderId child listing
      where.folderId = folderId;
      if (view === 'trash') {
        where.deletedAt = { not: null };
      } else {
        where.deletedAt = null;
      }
    } else {
      // At the root level of the specific view
      if (view === 'trash') {
        where.deletedAt = { not: null };
      } else if (view === 'starred') {
        where.deletedAt = null;
        where.starred = true;
        if (userId) {
          where.OR = [
            { createdBy: userId },
            { shares: { some: { userId } } }
          ];
        }
      } else if (view === 'shared') {
        where.deletedAt = null;
        where.folderId = null; // Only show root-level shared documents
        if (userId) {
          where.shares = { some: { userId } };
        }
      } else {
        // Default 'my-drive' (root personal document list)
        where.deletedAt = null;
        where.folderId = null;
        if (userId) {
          where.createdBy = userId;
        }
      }
    }

    return prisma.document.findMany({
      where,
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        signatures: true,
        shares: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createDocument(
    tenantId: string,
    orgId: string,
    dto: { name: string; folderId?: string; templateId?: string },
    createdBy: string,
    file?: Express.Multer.File
  ) {
    await this.ensureBucketExists();
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

      if (file) {
        const iv = crypto.randomBytes(16);
        const fileKey = `drive/${tenantId}/${doc.id}/v1_${file.originalname}`;
        const encryptedBuffer = this.encryptBuffer(file.buffer, iv);

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: encryptedBuffer,
            ContentType: file.mimetype,
          })
        );

        await tx.documentVersion.create({
          data: {
            tenantId,
            documentId: doc.id,
            versionNumber: 1,
            fileUrl: fileKey,
            fileSize: file.size,
            iv: iv.toString('hex'),
            createdBy,
          },
        });
      }

      return tx.document.findUnique({
        where: { id: doc.id },
        include: { versions: true, signatures: true, shares: true },
      });
    });
  }

  async addVersion(
    tenantId: string,
    documentId: string,
    createdBy: string,
    file: Express.Multer.File
  ) {
    await this.ensureBucketExists();
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const iv = crypto.randomBytes(16);
    const fileKey = `drive/${tenantId}/${documentId}/v${nextVersionNumber}_${file.originalname}`;
    const encryptedBuffer = this.encryptBuffer(file.buffer, iv);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: encryptedBuffer,
        ContentType: file.mimetype,
      })
    );

    return prisma.documentVersion.create({
      data: {
        tenantId,
        documentId,
        versionNumber: nextVersionNumber,
        fileUrl: fileKey,
        fileSize: file.size,
        iv: iv.toString('hex'),
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

  // E-Signature / Download Decryption
  async downloadVersion(tenantId: string, versionId: string) {
    const version = await prisma.documentVersion.findFirst({
      where: { id: versionId, tenantId },
      include: { document: true }
    });
    if (!version) throw new NotFoundException('Document version not found');

    const s3Res = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: version.fileUrl,
      })
    );

    const encryptedBuffer = await streamToBuffer(s3Res.Body);
    if (!version.iv) {
      // Backward compatible for unencrypted files
      return {
        filename: version.document.name,
        buffer: encryptedBuffer,
      };
    }

    const iv = Buffer.from(version.iv, 'hex');
    const decryptedBuffer = this.decryptBuffer(encryptedBuffer, iv);

    return {
      filename: version.document.name,
      buffer: decryptedBuffer,
    };
  }

  // Star Operations
  async toggleFolderStarred(tenantId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');

    return prisma.folder.update({
      where: { id: folderId },
      data: { starred: !folder.starred },
    });
  }

  async toggleDocumentStarred(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    return prisma.document.update({
      where: { id: documentId },
      data: { starred: !doc.starred },
    });
  }

  // Custom sharing & roles
  async shareFolder(tenantId: string, folderId: string, dto: { userId: string; role: string; password?: string; expiresAt?: string }) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');

    const passwordHash = dto.password ? crypto.createHash('sha256').update(dto.password).digest('hex') : null;

    return prisma.folderShare.create({
      data: {
        tenantId,
        folderId,
        userId: dto.userId,
        role: dto.role,
        password: passwordHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async shareDocument(tenantId: string, documentId: string, dto: { userId: string; role: string; password?: string; expiresAt?: string }) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    const passwordHash = dto.password ? crypto.createHash('sha256').update(dto.password).digest('hex') : null;

    return prisma.documentShare.create({
      data: {
        tenantId,
        documentId,
        userId: dto.userId,
        role: dto.role,
        password: passwordHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  // Soft-Delete (Trash) & Purges
  async trashFolder(tenantId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.legalHold) throw new BadRequestException('Cannot trash folder: Legal Hold is active.');

    return prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() },
    });
  }

  async restoreFolder(tenantId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');

    return prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: null },
    });
  }

  async permanentlyDeleteFolder(tenantId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.legalHold) throw new BadRequestException('Cannot delete folder: Legal Hold is active.');

    // Find and delete S3 file versions of nested docs
    const docs = await prisma.document.findMany({
      where: { folderId, tenantId },
      include: { versions: true }
    });

    for (const doc of docs) {
      for (const version of doc.versions) {
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: version.fileUrl,
            })
          );
        } catch (err: any) {
          this.logger.warn(`S3 delete failed for ${version.fileUrl}: ${err.message}`);
        }
      }
    }

    return prisma.folder.delete({ where: { id: folderId } });
  }

  async trashDocument(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.legalHold) throw new BadRequestException('Cannot trash document: Legal Hold is active.');

    return prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });
  }

  async restoreDocument(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    return prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: null },
    });
  }

  async permanentlyDeleteDocument(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId }, include: { versions: true } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.legalHold) throw new BadRequestException('Cannot delete document: Legal Hold is active.');

    for (const version of doc.versions) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: version.fileUrl,
          })
        );
      } catch (err: any) {
        this.logger.warn(`S3 delete failed for ${version.fileUrl}: ${err.message}`);
      }
    }

    return prisma.document.delete({ where: { id: documentId } });
  }

  async toggleFolderLegalHold(tenantId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');

    return prisma.folder.update({
      where: { id: folderId },
      data: { legalHold: !folder.legalHold },
    });
  }

  async toggleDocumentLegalHold(tenantId: string, documentId: string) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');

    return prisma.document.update({
      where: { id: documentId },
      data: { legalHold: !doc.legalHold },
    });
  }

  // Storage Stats Quota
  async getUsage(tenantId: string) {
    const versions = await prisma.documentVersion.findMany({ where: { tenantId } });
    const totalBytes = versions.reduce((sum, v) => sum + v.fileSize, 0);

    const categories = {
      documents: 0,
      images: 0,
      others: 0,
    };

    for (const v of versions) {
      const url = v.fileUrl.toLowerCase();
      if (url.endsWith('.pdf') || url.endsWith('.doc') || url.endsWith('.docx') || url.endsWith('.txt')) {
        categories.documents += v.fileSize;
      } else if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif')) {
        categories.images += v.fileSize;
      } else {
        categories.others += v.fileSize;
      }
    }

    return {
      usedBytes: totalBytes,
      totalLimitBytes: 15 * 1024 * 1024 * 1024, // 15 GB like Google Drive
      categories,
    };
  }

  // Tenant search index
  async search(tenantId: string, query: string) {
    if (!query) return [];
    
    const [folders, documents] = await Promise.all([
      prisma.folder.findMany({
        where: {
          tenantId,
          deletedAt: null,
          name: { contains: query, mode: 'insensitive' }
        }
      }),
      prisma.document.findMany({
        where: {
          tenantId,
          deletedAt: null,
          name: { contains: query, mode: 'insensitive' }
        },
        include: { versions: { orderBy: { versionNumber: 'desc' } } }
      })
    ]);

    return { folders, documents };
  }

  // Get tenant users list
  async getUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
  }
}
