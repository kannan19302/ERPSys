import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import * as crypto from "node:crypto";

@Injectable()
export class DomainService {
  private generateVerificationKey(): string {
    return `dom_verify_${crypto.randomBytes(16).toString("hex")}`;
  }

  async listDomains(tenantId: string) {
    return prisma.tenantDomain.findMany({
      where: { tenantId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
  }

  async addDomain(tenantId: string, dto: {
    domain: string;
    isPrimary?: boolean;
  }) {
    const existing = await prisma.tenantDomain.findUnique({
      where: { domain: dto.domain },
    });
    if (existing) throw new ConflictException("Domain already registered");

    if (dto.isPrimary) {
      await prisma.tenantDomain.updateMany({
        where: { tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const verificationKey = this.generateVerificationKey();

    return prisma.tenantDomain.create({
      data: {
        tenantId,
        domain: dto.domain,
        isPrimary: dto.isPrimary ?? false,
        verificationKey,
      },
    });
  }

  async verifyDomain(tenantId: string, id: string) {
    const domain = await prisma.tenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException("Domain not found");

    return prisma.tenantDomain.update({
      where: { id },
      data: { verifiedAt: new Date(), status: "ACTIVE" },
    });
  }

  async removeDomain(tenantId: string, id: string) {
    const domain = await prisma.tenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException("Domain not found");

    await prisma.tenantBranding.updateMany({
      where: { customDomainId: id },
      data: { customDomainId: null },
    });

    return prisma.tenantDomain.delete({ where: { id } });
  }

  async setPrimaryDomain(tenantId: string, id: string) {
    const domain = await prisma.tenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException("Domain not found");

    await prisma.tenantDomain.updateMany({
      where: { tenantId, isPrimary: true },
      data: { isPrimary: false },
    });

    return prisma.tenantDomain.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  async getDomain(tenantId: string, id: string) {
    const domain = await prisma.tenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException("Domain not found");
    return domain;
  }

  async requestSslCertificate(tenantId: string, id: string) {
    const domain = await prisma.tenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException("Domain not found");

    return prisma.tenantDomain.update({
      where: { id },
      data: { sslStatus: "PENDING" },
    });
  }

  async checkSslStatus(tenantId: string, id: string) {
    const domain = await prisma.tenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException("Domain not found");

    return {
      id: domain.id,
      domain: domain.domain,
      sslStatus: domain.sslStatus,
      sslExpiresAt: domain.sslExpiresAt,
    };
  }
}
