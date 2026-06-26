import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SignatureWorkflowService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createSignatureRequest(
    tenantId: string,
    dto: {
      documentId: string;
      signerEmails: string[];
      sequential: boolean;
    },
  ) {
    const document = await prisma.document.findFirst({ where: { id: dto.documentId, tenantId } });
    if (!document) throw new NotFoundException('Document not found');

    const signatures = [];
    for (const email of dto.signerEmails) {
      const sig = await prisma.signature.create({
        data: {
          tenantId,
          documentId: dto.documentId,
          signerEmail: email,
          status: 'PENDING',
        },
      });
      signatures.push(sig);
    }

    // Notify signers
    const toNotify = dto.sequential ? dto.signerEmails.slice(0, 1) : dto.signerEmails;
    for (const email of toNotify) {
      this.eventEmitter.emit('notification.send', {
        tenantId,
        userId: 'system',
        type: 'SIGNATURE_REQUEST',
        title: `Signature requested on document ${document.name}`,
        body: `Please sign: ${email}`,
      });
    }

    return { documentId: dto.documentId, signatures, sequential: dto.sequential };
  }

  async signDocument(tenantId: string, signatureId: string, signatureData: string, ipAddress?: string) {
    const signature = await prisma.signature.findFirst({ where: { id: signatureId, tenantId } });
    if (!signature) throw new NotFoundException('Signature not found');
    if (signature.status !== 'PENDING') throw new BadRequestException('Already signed or declined');

    await prisma.signature.update({
      where: { id: signatureId },
      data: {
        status: 'SIGNED',
        signatureData,
        signedAt: new Date(),
        ipAddress: ipAddress || null,
      },
    });

    // Check if all signatures for this document are complete
    const remaining = await prisma.signature.count({
      where: { tenantId, documentId: signature.documentId, status: 'PENDING' },
    });

    if (remaining === 0) {
      await prisma.document.update({
        where: { id: signature.documentId },
        data: { signatureStatus: 'COMPLETED' },
      });

      this.eventEmitter.emit('notification.send', {
        tenantId, userId: 'system', type: 'SIGNATURE_COMPLETED',
        title: 'All signatures collected',
      });
    }

    return { signatureId, status: 'SIGNED', remainingSignatures: remaining };
  }

  async getDocumentSignatures(tenantId: string, documentId: string) {
    const signatures = await prisma.signature.findMany({
      where: { tenantId, documentId },
      orderBy: { id: 'asc' },
    });

    return {
      documentId,
      total: signatures.length,
      signed: signatures.filter((s) => s.status === 'SIGNED').length,
      pending: signatures.filter((s) => s.status === 'PENDING').length,
      signatures: signatures.map((s) => ({
        id: s.id,
        signerEmail: s.signerEmail,
        status: s.status,
        signedAt: s.signedAt,
      })),
    };
  }
}
