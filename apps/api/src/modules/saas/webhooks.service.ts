import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import * as crypto from "node:crypto";

@Injectable()
export class WebhooksService {
  private readonly availableEvents = [
    { id: "subscription.created", name: "Subscription Created", description: "A new subscription was created" },
    { id: "subscription.updated", name: "Subscription Updated", description: "Subscription plan or status changed" },
    { id: "subscription.cancelled", name: "Subscription Cancelled", description: "A subscription was cancelled" },
    { id: "subscription.expired", name: "Subscription Expired", description: "A subscription has expired" },
    { id: "invoice.created", name: "Invoice Created", description: "A new invoice was generated" },
    { id: "invoice.paid", name: "Invoice Paid", description: "An invoice payment succeeded" },
    { id: "invoice.overdue", name: "Invoice Overdue", description: "An invoice is past due" },
    { id: "invoice.refunded", name: "Invoice Refunded", description: "An invoice was refunded" },
    { id: "payment.failed", name: "Payment Failed", description: "A payment attempt failed" },
    { id: "usage.alert", name: "Usage Alert Triggered", description: "Usage exceeded a threshold" },
    { id: "user.added", name: "User Added", description: "A new user was added to the tenant" },
    { id: "user.removed", name: "User Removed", description: "A user was removed from the tenant" },
    { id: "ticket.created", name: "Support Ticket Created", description: "A new support ticket was opened" },
    { id: "ticket.updated", name: "Support Ticket Updated", description: "A ticket status changed" },
    { id: "domain.verified", name: "Domain Verified", description: "A custom domain was verified" },
    { id: "export.completed", name: "Data Export Completed", description: "A data export is ready for download" },
  ];

  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString("hex")}`;
  }

  async listEndpoints(tenantId: string) {
    return prisma.tenantWebhookEndpoint.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createEndpoint(tenantId: string, dto: {
    url: string;
    description?: string;
    events: string[];
    secret?: string;
    enabled?: boolean;
    filter?: Record<string, unknown>;
    retryCount?: number;
    timeoutMs?: number;
    apiVersion?: string;
  }) {
    const secret = dto.secret ?? this.generateSecret();

    const endpoint = await prisma.tenantWebhookEndpoint.create({
      data: {
        tenantId,
        name: dto.description ?? `Webhook ${dto.url.substring(0, 30)}`,
        url: dto.url,
        secret,
        events: dto.events as any,
        isActive: dto.enabled ?? true,
      },
    });

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      secret,
      isActive: endpoint.isActive,
      createdAt: endpoint.createdAt,
    };
  }

  async updateEndpoint(tenantId: string, id: string, dto: {
    url?: string;
    description?: string;
    events?: string[];
    secret?: string;
    enabled?: boolean;
    filter?: Record<string, unknown>;
    retryCount?: number;
    timeoutMs?: number;
    apiVersion?: string;
  }) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");

    const updateData: Record<string, unknown> = {};
    if (dto.url !== undefined) updateData.url = dto.url;
    if (dto.description !== undefined) updateData.name = dto.description;
    if (dto.events !== undefined) updateData.events = dto.events as any;
    if (dto.enabled !== undefined) updateData.isActive = dto.enabled;

    return prisma.tenantWebhookEndpoint.update({ where: { id }, data: updateData });
  }

  async deleteEndpoint(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    await prisma.tenantWebhookDelivery.deleteMany({ where: { endpointId: id } });
    return prisma.tenantWebhookEndpoint.delete({ where: { id } });
  }

  async getEndpoint(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    return endpoint;
  }

  async getEndpointSecret(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    return {
      id: endpoint.id,
      secret: endpoint.secret.substring(0, 10) + "****",
    };
  }

  async rotateSecret(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");

    const newSecret = this.generateSecret();
    await prisma.tenantWebhookEndpoint.update({
      where: { id },
      data: { secret: newSecret },
    });

    return { id, secret: newSecret };
  }

  async listDeliveries(tenantId: string, endpointId: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id: endpointId, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");

    const [items, total] = await Promise.all([
      prisma.tenantWebhookDelivery.findMany({
        where: { endpointId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tenantWebhookDelivery.count({ where: { endpointId } }),
    ]);

    return { items, total };
  }

  async redeliverEvent(tenantId: string, deliveryId: string) {
    const delivery = await prisma.tenantWebhookDelivery.findFirst({
      where: { id: deliveryId, tenantId },
      include: { endpoint: true },
    });
    if (!delivery) throw new NotFoundException("Delivery not found");

    return prisma.tenantWebhookDelivery.create({
      data: {
        endpointId: delivery.endpointId,
        tenantId: delivery.tenantId,
        event: delivery.event,
        payload: delivery.payload as any,
        status: "RETRYING",
        attempt: delivery.attempt + 1,
        maxAttempts: delivery.maxAttempts,
      },
    });
  }

  async getAvailableEvents() {
    return this.availableEvents;
  }

  async testEndpoint(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");

    const testPayload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook event from UniERP" },
    };

    return prisma.tenantWebhookDelivery.create({
      data: {
        endpointId: id,
        tenantId: endpoint.tenantId,
        event: "test.ping",
        payload: testPayload as any,
        status: "PENDING",
      },
    });
  }

  async getDeliveryStats(tenantId: string, endpointId: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id: endpointId, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");

    const [total, delivered, failed, pending] = await Promise.all([
      prisma.tenantWebhookDelivery.count({ where: { endpointId } }),
      prisma.tenantWebhookDelivery.count({ where: { endpointId, status: "DELIVERED" } }),
      prisma.tenantWebhookDelivery.count({ where: { endpointId, status: "FAILED" } }),
      prisma.tenantWebhookDelivery.count({ where: { endpointId, status: "PENDING" } }),
    ]);

    return {
      total,
      delivered,
      failed,
      pending,
      retrying: await prisma.tenantWebhookDelivery.count({ where: { endpointId, status: "RETRYING" } }),
      successRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      consecutiveFailures: endpoint.consecutiveFailures,
    };
  }

  async disableEndpoint(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    return prisma.tenantWebhookEndpoint.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async enableEndpoint(tenantId: string, id: string) {
    const endpoint = await prisma.tenantWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    return prisma.tenantWebhookEndpoint.update({
      where: { id },
      data: { isActive: true, consecutiveFailures: 0 },
    });
  }

  async triggerWebhook(tenantId: string, event: string, payload: any) {
    const endpoints = await prisma.tenantWebhookEndpoint.findMany({
      where: { tenantId, isActive: true },
    });

    const deliveries = [];
    for (const endpoint of endpoints) {
      const events = endpoint.events as string[];
      if (!events.includes(event)) continue;

      const delivery = await prisma.tenantWebhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          tenantId,
          event,
          payload,
          status: "PENDING",
        },
      });
      deliveries.push(delivery);
    }

    return { triggerCount: deliveries.length, deliveries };
  }
}
