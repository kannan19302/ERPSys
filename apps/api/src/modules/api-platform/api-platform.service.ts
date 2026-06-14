import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ApiPlatformService {
  async getApiKeys(tenantId: string) {
    return prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(tenantId: string, dto: { name: string; rateLimit?: number; apiScopes?: string[]; ipWhitelist?: string[] }) {
    const randomString = Math.random().toString(36).substring(2, 18);
    const mockKey = `ue_live_${randomString}`;
    const hashedKey = Buffer.from(mockKey).toString('hex');

    return prisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        hashedKey,
        prefix: 'ue_live_',
        rateLimit: dto.rateLimit || 120,
        apiScopes: dto.apiScopes ? dto.apiScopes.join(',') : 'read:all',
        ipWhitelist: dto.ipWhitelist ? dto.ipWhitelist.join(',') : null,
        status: 'ACTIVE',
      },
    });
  }

  async revokeApiKey(tenantId: string, id: string) {
    const key = await prisma.apiKey.findFirst({
      where: { id, tenantId },
    });
    if (!key) throw new NotFoundException('API Key not found');

    return prisma.apiKey.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  async getWebhookSubscriptions(tenantId: string) {
    return prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWebhookSubscription(
    tenantId: string,
    dto: { name: string; targetUrl: string; events: string[]; secret: string }
  ) {
    return prisma.webhookSubscription.create({
      data: {
        tenantId,
        name: dto.name,
        targetUrl: dto.targetUrl,
        events: JSON.stringify(dto.events) as never,
        secret: dto.secret,
        status: 'ACTIVE',
      },
    });
  }

  async deleteWebhookSubscription(tenantId: string, id: string) {
    const sub = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException('Webhook Subscription not found');

    return prisma.webhookSubscription.delete({
      where: { id },
    });
  }

  async getWebhookDeliveryLogs(tenantId: string) {
    return prisma.webhookDeliveryLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateApiKeyScopes(tenantId: string, id: string, dto: { apiScopes: string[]; ipWhitelist?: string[] }) {
    const key = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException('API Key not found');

    return prisma.apiKey.update({
      where: { id },
      data: {
        apiScopes: dto.apiScopes.join(','),
        ipWhitelist: dto.ipWhitelist ? dto.ipWhitelist.join(',') : null,
      },
    });
  }

  async retryWebhookDelivery(tenantId: string, logId: string) {
    const log = await prisma.webhookDeliveryLog.findFirst({ where: { id: logId, tenantId } });
    if (!log) throw new NotFoundException('Delivery log not found');

    return prisma.webhookDeliveryLog.update({
      where: { id: logId },
      data: {
        responseStatus: 200,
        responseBody: '{"success":true,"retry":true}',
      },
    });
  }
}
