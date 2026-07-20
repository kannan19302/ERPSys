import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import * as crypto from "node:crypto";

@Injectable()
export class ApiKeysService {
  private readonly KEY_PREFIX = "uerp_";

  private generateApiKey(): { fullKey: string; prefix: string; hash: string } {
    const raw = crypto.randomBytes(32).toString("hex");
    const fullKey = `${this.KEY_PREFIX}${raw}`;
    const prefix = fullKey.substring(0, 10);
    const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
    return { fullKey, prefix, hash };
  }

  private maskKey(fullKey: string): string {
    if (fullKey.length <= 10) return fullKey;
    return fullKey.substring(0, 10) + "****" + fullKey.substring(fullKey.length - 4);
  }

  async listApiKeys(tenantId: string) {
    const keys = await prisma.tenantApiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      permissions: key.permissions,
      isActive: key.isActive,
      createdAt: key.createdAt,
      maskedKey: this.maskKey(key.keyPrefix + "***"),
    }));
  }

  async createApiKey(tenantId: string, dto: {
    name: string;
    permissions?: string[];
    allowedIps?: string[];
    expiresAt?: string;
    rateLimit?: number;
  }) {
    const existing = await prisma.tenantApiKey.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (existing) throw new ConflictException("API key with this name already exists");

    const { fullKey, prefix, hash } = this.generateApiKey();

    const key = await prisma.tenantApiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyPrefix: prefix,
        keyHash: hash,
        permissions: dto.permissions ?? [],
        ipWhitelist: dto.allowedIps ?? [],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: key.id,
      name: key.name,
      fullKey,
      keyPrefix: prefix,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    };
  }

  async revokeApiKey(tenantId: string, id: string) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return prisma.tenantApiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getApiKey(tenantId: string, id: string) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return {
      id: key.id,
      name: key.name,
      tenantId: key.tenantId,
      keyPrefix: key.keyPrefix,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      permissions: key.permissions,
      ipWhitelist: key.ipWhitelist,
      isActive: key.isActive,
      createdAt: key.createdAt,
    };
  }

  async updateApiKey(tenantId: string, id: string, dto: {
    name?: string;
    permissions?: string[];
    allowedIps?: string[];
    rateLimit?: number;
  }) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.permissions !== undefined) updateData.permissions = dto.permissions;
    if (dto.allowedIps !== undefined) updateData.ipWhitelist = dto.allowedIps;
    return prisma.tenantApiKey.update({ where: { id }, data: updateData });
  }

  async rotateApiKey(tenantId: string, id: string) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");

    const { fullKey, prefix, hash } = this.generateApiKey();

    await prisma.tenantApiKey.update({
      where: { id },
      data: { keyPrefix: prefix, keyHash: hash },
    });

    return { id, fullKey, keyPrefix: prefix };
  }

  async validateApiKey(key: string) {
    const hash = crypto.createHash("sha256").update(key).digest("hex");
    const apiKey = await prisma.tenantApiKey.findFirst({
      where: { keyHash: hash, isActive: true },
    });
    if (!apiKey) return null;

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      await prisma.tenantApiKey.update({
        where: { id: apiKey.id },
        data: { isActive: false },
      });
      return null;
    }

    await prisma.tenantApiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      tenantId: apiKey.tenantId,
      keyId: apiKey.id,
      permissions: apiKey.permissions as string[],
      ipWhitelist: apiKey.ipWhitelist as string[],
    };
  }

  async getApiKeyUsage(tenantId: string, id: string) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return prisma.tenantAuditLog.count({
      where: { tenantId, resource: "api-key", resourceId: id },
    });
  }

  async setKeyExpiry(tenantId: string, id: string, body: { expiresAt: string | null }) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return prisma.tenantApiKey.update({
      where: { id },
      data: { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null },
    });
  }
}
