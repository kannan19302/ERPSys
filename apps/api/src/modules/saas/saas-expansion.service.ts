import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { buildPaginationValues, paginatedResult } from '../../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class SaasExpansionService {
  private get p(): any { return prisma; }

  // ═══ APP MARKETPLACE ═══

  async getApps(tenantId: string, query: { category?: string; isPublished?: string; search?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.category) where.category = query.category;
    if (query.isPublished) where.isPublished = query.isPublished === 'true';
    if (query.search) { where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }]; }
    const [data, total] = await Promise.all([
      this.p.saasApp.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], skip, take, include: { _count: { select: { installations: true } } } }),
      this.p.saasApp.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getAppById(tenantId: string, id: string) {
    const app = await this.p.saasApp.findFirst({ where: { id, tenantId }, include: { versions: { orderBy: { createdAt: 'desc' } }, permissionsRel: true } });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  async createApp(tenantId: string, dto: any) {
    const existing = await this.p.saasApp.findFirst({ where: { tenantId, slug: dto.slug } });
    if (existing) throw new BadRequestException('App with this slug already exists');
    return this.p.saasApp.create({ data: { tenantId, ...dto, price: new Prisma.Decimal(dto.price || 0), setupFee: new Prisma.Decimal(dto.setupFee || 0) } });
  }

  async updateApp(tenantId: string, id: string, dto: any) {
    const app = await this.p.saasApp.findFirst({ where: { id, tenantId } });
    if (!app) throw new NotFoundException('App not found');
    return this.p.saasApp.update({ where: { id }, data: dto });
  }

  async deleteApp(tenantId: string, id: string) {
    const app = await this.p.saasApp.findFirst({ where: { id, tenantId } });
    if (!app) throw new NotFoundException('App not found');
    return this.p.saasApp.update({ where: { id }, data: { isPublished: false } });
  }

  async createAppVersion(tenantId: string, dto: any) {
    const app = await this.p.saasApp.findFirst({ where: { id: dto.appId, tenantId } });
    if (!app) throw new NotFoundException('App not found');
    return this.p.saasAppVersion.create({ data: { tenantId, ...dto, releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null } });
  }

  async installApp(tenantId: string, appId: string, installingTenantId: string, userId: string) {
    const app = await this.p.saasApp.findFirst({ where: { id: appId, tenantId } });
    if (!app) throw new NotFoundException('App not found');
    const existing = await this.p.saasAppInstallation.findFirst({ where: { tenantId, appId, installingTenantId, status: { in: ['INSTALLING', 'ACTIVE'] } } });
    if (existing) throw new BadRequestException('App is already installed');
    return this.p.$transaction(async (tx: any) => {
      const install = await tx.saasAppInstallation.create({
        data: { tenantId, appId, installingTenantId, installedBy: userId, status: 'ACTIVE' },
      });
      await tx.saasApp.update({ where: { id: appId }, data: { installCount: { increment: 1 } } });
      return install;
    });
  }

  async uninstallApp(tenantId: string, id: string) {
    const install = await this.p.saasAppInstallation.findFirst({ where: { id, tenantId } });
    if (!install) throw new NotFoundException('Installation not found');
    return this.p.$transaction(async (tx: any) => {
      const updated = await tx.saasAppInstallation.update({ where: { id }, data: { status: 'UNINSTALLED', uninstalledAt: new Date() } });
      await tx.saasApp.update({ where: { id: install.appId }, data: { installCount: { decrement: 1 } } });
      return updated;
    });
  }

  // ═══ SUBSCRIPTION PLANS ═══

  async getSubscriptionPlans(tenantId: string) {
    return this.p.saasSubscriptionPlan.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: 'asc' } });
  }

  async createSubscriptionPlan(tenantId: string, dto: any) {
    return this.p.saasSubscriptionPlan.create({ data: { tenantId, ...dto, price: new Prisma.Decimal(dto.price) } });
  }

  async updateSubscriptionPlan(tenantId: string, id: string, dto: any) {
    const plan = await this.p.saasSubscriptionPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.p.saasSubscriptionPlan.update({ where: { id }, data: dto });
  }

  async deleteSubscriptionPlan(tenantId: string, id: string) {
    const plan = await this.p.saasSubscriptionPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.p.saasSubscriptionPlan.update({ where: { id }, data: { isActive: false } });
  }

  // ═══ SUBSCRIPTIONS ═══

  async getSubscriptions(tenantId: string, query: { status?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.p.saasSubscription.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { plan: true, lineItems: true } }),
      this.p.saasSubscription.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async createSubscription(tenantId: string, dto: any) {
    const plan = await this.p.saasSubscriptionPlan.findFirst({ where: { id: dto.planId, tenantId, isActive: true } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    const totalPrice = Number(plan.price) * dto.quantity;
    const now = new Date();
    const periodEnd = new Date(now);
    if (dto.billingInterval === 'MONTHLY') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (dto.billingInterval === 'YEARLY') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else if (dto.billingInterval === 'QUARTERLY') periodEnd.setMonth(periodEnd.getMonth() + 3);
    return this.p.saasSubscription.create({
      data: {
        tenantId, subscribingTenantId: dto.subscribingTenantId, planId: dto.planId,
        quantity: dto.quantity || 1, unitPrice: plan.price, totalPrice: new Prisma.Decimal(totalPrice),
        billingInterval: dto.billingInterval || 'MONTHLY', currency: plan.currency || 'USD',
        trialEndsAt: dto.trialDays ? new Date(Date.now() + dto.trialDays * 86400000) : null,
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        status: dto.trialDays ? 'TRIALING' : 'ACTIVE', activatedAt: now,
        metadata: dto.metadata || {},
      },
    });
  }

  async updateSubscriptionStatus(tenantId: string, id: string, status: string, reason?: string) {
    const sub = await this.p.saasSubscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    const updateData: any = { status };
    if (status === 'CANCELED') { updateData.canceledAt = new Date(); updateData.cancelReason = reason || null; }
    return this.p.saasSubscription.update({ where: { id }, data: updateData });
  }

  // ═══ USAGE METERING ═══

  async getUsageMeters(tenantId: string) {
    return this.p.saasUsageMeter.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });
  }

  async createUsageMeter(tenantId: string, dto: any) {
    const existing = await this.p.saasUsageMeter.findFirst({ where: { tenantId, slug: dto.slug } });
    if (existing) throw new BadRequestException('Usage meter with this slug already exists');
    return this.p.saasUsageMeter.create({ data: { tenantId, ...dto } });
  }

  async recordUsage(tenantId: string, dto: any) {
    const sub = await this.p.saasSubscription.findFirst({ where: { id: dto.subscriptionId, tenantId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    const meter = await this.p.saasUsageMeter.findFirst({ where: { id: dto.meterId, tenantId } });
    if (!meter) throw new NotFoundException('Usage meter not found');
    return this.p.saasUsageRecord.create({
      data: { tenantId, subscriptionId: dto.subscriptionId, meterId: dto.meterId, usage: new Prisma.Decimal(dto.usage), metadata: dto.metadata || {} },
    });
  }

  async getUsageRecords(tenantId: string, subscriptionId: string, meterId?: string) {
    const where: any = { tenantId, subscriptionId };
    if (meterId) where.meterId = meterId;
    return this.p.saasUsageRecord.findMany({ where, orderBy: { recordedAt: 'desc' }, take: 100 });
  }

  // ═══ INVOICES & PAYMENTS ═══

  async getInvoices(tenantId: string, query: { status?: string; billingTenantId?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.billingTenantId) where.billingTenantId = query.billingTenantId;
    const [data, total] = await Promise.all([
      this.p.saasInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { lineItems: true, payments: true } }),
      this.p.saasInvoice.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async createInvoice(tenantId: string, dto: any) {
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    let discountAmount = 0;
    if (dto.couponCode) {
      const coupon = await this.p.saasCoupon.findFirst({ where: { tenantId, code: dto.couponCode.toUpperCase(), isActive: true } });
      if (coupon) {
        if (coupon.type === 'PERCENTAGE') discountAmount = dto.lineItems.reduce((s: number, li: any) => s + li.unitPrice * li.quantity, 0) * Number(coupon.value) / 100;
        else if (coupon.type === 'FIXED') discountAmount = Number(coupon.value);
      }
    }
    const subtotal = dto.lineItems.reduce((s: number, li: any) => s + li.unitPrice * li.quantity, 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    return this.p.$transaction(async (tx: any) => {
      const invoice = await tx.saasInvoice.create({
        data: {
          tenantId, subscriptionId: dto.subscriptionId || null, invoiceNumber,
          billingTenantId: dto.billingTenantId, status: 'PENDING',
          subtotal: new Prisma.Decimal(subtotal), discountAmount: new Prisma.Decimal(discountAmount),
          totalAmount: new Prisma.Decimal(totalAmount), dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 30 * 86400000),
          notes: dto.notes || null,
        },
      });
      for (const li of dto.lineItems) {
        await tx.saasInvoiceLineItem.create({
          data: { tenantId, invoiceId: invoice.id, description: li.description, type: li.type || 'SUBSCRIPTION', quantity: li.quantity || 1, unitPrice: new Prisma.Decimal(li.unitPrice), totalPrice: new Prisma.Decimal(li.unitPrice * li.quantity) },
        });
      }
      if (dto.couponCode) {
        const coupon = await this.p.saasCoupon.findFirst({ where: { tenantId, code: dto.couponCode.toUpperCase() } });
        if (coupon && discountAmount > 0) {
          await tx.saasCoupon.update({ where: { id: coupon.id }, data: { currentRedemptions: { increment: 1 } } });
        }
      }
      return tx.saasInvoice.findFirst({ where: { id: invoice.id }, include: { lineItems: true } });
    });
  }

  async recordPayment(tenantId: string, dto: any) {
    const invoice = await this.p.saasInvoice.findFirst({ where: { id: dto.invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.p.$transaction(async (tx: any) => {
      const payment = await tx.saasPayment.create({
        data: { tenantId, invoiceId: dto.invoiceId, subscriptionId: dto.subscriptionId || null, amount: new Prisma.Decimal(dto.amount), method: dto.method || 'CARD', gateway: dto.gateway || null, gatewayTransactionId: dto.gatewayTransactionId || null, status: 'COMPLETED', paidAt: new Date(), metadata: dto.metadata || {} },
      });
      const newPaid = Number(invoice.paidAmount) + dto.amount;
      const newStatus = newPaid >= Number(invoice.totalAmount) ? 'PAID' : invoice.status;
      await tx.saasInvoice.update({ where: { id: dto.invoiceId }, data: { paidAmount: new Prisma.Decimal(newPaid), status: newStatus, paidAt: newStatus === 'PAID' ? new Date() : null } });
      return payment;
    });
  }

  // ═══ COUPONS ═══

  async getCoupons(tenantId: string) {
    return this.p.saasCoupon.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createCoupon(tenantId: string, dto: any) {
    const existing = await this.p.saasCoupon.findFirst({ where: { tenantId, code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Coupon code already exists');
    return this.p.saasCoupon.create({ data: { tenantId, ...dto, code: dto.code.toUpperCase(), value: new Prisma.Decimal(dto.value) } });
  }

  // ═══ FEATURE FLAGS ═══

  async getFeatureFlags(tenantId: string) {
    return this.p.saasFeatureFlag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createFeatureFlag(tenantId: string, dto: any) {
    return this.p.saasFeatureFlag.create({ data: { tenantId, ...dto } });
  }

  async toggleFeatureFlag(tenantId: string, id: string, isEnabled: boolean) {
    const ff = await this.p.saasFeatureFlag.findFirst({ where: { id, tenantId } });
    if (!ff) throw new NotFoundException('Feature flag not found');
    return this.p.saasFeatureFlag.update({ where: { id }, data: { isEnabled } });
  }

  // ═══ TENANT SETTINGS ═══

  async getTenantSettings(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return this.p.saasTenantSetting.findMany({ where });
  }

  async upsertTenantSetting(tenantId: string, dto: any) {
    return this.p.saasTenantSetting.upsert({
      where: { tenantId_category_key: { tenantId, category: dto.category || 'general', key: dto.key } },
      create: { tenantId, category: dto.category || 'general', key: dto.key, value: dto.value },
      update: { value: dto.value },
    });
  }

  async deleteTenantSetting(tenantId: string, category: string, key: string) {
    const setting = await this.p.saasTenantSetting.findFirst({ where: { tenantId, category, key } });
    if (!setting) throw new NotFoundException('Setting not found');
    return this.p.saasTenantSetting.delete({ where: { id: setting.id } });
  }

  // ═══ DOMAINS ═══

  async getDomains(tenantId: string) {
    return this.p.saasTenantDomain.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async addDomain(tenantId: string, dto: any) {
    const existing = await this.p.saasTenantDomain.findFirst({ where: { domain: dto.domain } });
    if (existing) throw new BadRequestException('Domain already exists');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    if (dto.isPrimary) { await this.p.saasTenantDomain.updateMany({ where: { tenantId }, data: { isPrimary: false } }); }
    return this.p.saasTenantDomain.create({
      data: { tenantId, domain: dto.domain, isPrimary: dto.isPrimary || false, verificationToken },
    });
  }

  async verifyDomain(tenantId: string, id: string) {
    const domain = await this.p.saasTenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException('Domain not found');
    return this.p.saasTenantDomain.update({ where: { id }, data: { isVerified: true, verifiedAt: new Date() } });
  }

  async deleteDomain(tenantId: string, id: string) {
    const domain = await this.p.saasTenantDomain.findFirst({ where: { id, tenantId } });
    if (!domain) throw new NotFoundException('Domain not found');
    return this.p.saasTenantDomain.delete({ where: { id } });
  }

  // ═══ AUDIT LOG ═══

  async getAuditLogs(tenantId: string, query: { action?: string; actorId?: string; resource?: string; resourceId?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.action) where.action = query.action;
    if (query.actorId) where.actorId = query.actorId;
    if (query.resource) where.resource = query.resource;
    if (query.resourceId) where.resourceId = query.resourceId;
    const [data, total] = await Promise.all([
      this.p.saasAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.p.saasAuditLog.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  // ═══ WEBHOOKS ═══

  async getWebhookEndpoints(tenantId: string) {
    return this.p.saasWebhookEndpoint.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebhookEndpoint(tenantId: string, dto: any) {
    const secret = crypto.randomBytes(32).toString('hex');
    return this.p.saasWebhookEndpoint.create({ data: { tenantId, ...dto, secret } });
  }

  async updateWebhookEndpoint(tenantId: string, id: string, dto: any) {
    const wh = await this.p.saasWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!wh) throw new NotFoundException('Webhook endpoint not found');
    return this.p.saasWebhookEndpoint.update({ where: { id }, data: dto });
  }

  async deleteWebhookEndpoint(tenantId: string, id: string) {
    const wh = await this.p.saasWebhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!wh) throw new NotFoundException('Webhook endpoint not found');
    return this.p.saasWebhookEndpoint.delete({ where: { id } });
  }

  async getWebhookDeliveries(tenantId: string, endpointId: string, query: { status?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId, endpointId };
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.p.saasWebhookDelivery.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.p.saasWebhookDelivery.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  // ═══ API KEYS ═══

  async getApiKeys(tenantId: string) {
    return this.p.saasApiKey.findMany({ where: { tenantId, isActive: true }, orderBy: { createdAt: 'desc' }, include: { scopes: true } });
  }

  async createApiKey(tenantId: string, dto: any, userId: string) {
    const rawKey = `unerp_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = rawKey.substring(0, 10);
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const lastChars = rawKey.slice(-4);
    return this.p.$transaction(async (tx: any) => {
      const apiKey = await tx.saasApiKey.create({
        data: { tenantId, name: dto.name, key: rawKey, prefix, hash, lastChars, createdBy: userId, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
      });
      if (dto.scopes && dto.scopes.length > 0) {
        await tx.saasApiKeyScope.createMany({
          data: dto.scopes.map((s: string) => ({ tenantId, apiKeyId: apiKey.id, scope: s })),
        });
      }
      return { id: apiKey.id, name: apiKey.name, key: rawKey, prefix: apiKey.prefix, lastChars: apiKey.lastChars, scopes: dto.scopes || [] };
    });
  }

  async revokeApiKey(tenantId: string, id: string) {
    const apiKey = await this.p.saasApiKey.findFirst({ where: { id, tenantId } });
    if (!apiKey) throw new NotFoundException('API key not found');
    return this.p.saasApiKey.update({ where: { id }, data: { isActive: false } });
  }

  // ═══ SUPPORT TICKETS ═══

  async getSupportTickets(tenantId: string, query: { status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedTo) where.assignedTo = query.assignedTo;
    const [data, total] = await Promise.all([
      this.p.saasSupportTicket.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], skip, take, include: { _count: { select: { messages: true, attachments: true } } } }),
      this.p.saasSupportTicket.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getSupportTicketById(tenantId: string, id: string) {
    const ticket = await this.p.saasSupportTicket.findFirst({
      where: { id, tenantId },
      include: { messages: { include: { attachments: true }, orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async createSupportTicket(tenantId: string, dto: any, userId: string) {
    return this.p.saasSupportTicket.create({
      data: { tenantId, subject: dto.subject, description: dto.description || null, category: dto.category || null, priority: dto.priority || 'NORMAL', createdBy: userId, metadata: dto.metadata || {} },
    });
  }

  async updateSupportTicketStatus(tenantId: string, id: string, status: string, userId?: string) {
    const ticket = await this.p.saasSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    const updateData: any = { status };
    if (status === 'CLOSED') { updateData.closedBy = userId; updateData.closedAt = new Date(); }
    if (status === 'RESOLVED') { updateData.resolvedAt = new Date(); }
    return this.p.saasSupportTicket.update({ where: { id }, data: updateData });
  }

  async addTicketMessage(tenantId: string, dto: any, userId: string) {
    const ticket = await this.p.saasSupportTicket.findFirst({ where: { id: dto.ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return this.p.$transaction(async (tx: any) => {
      const message = await tx.saasSupportTicketMessage.create({
        data: { tenantId, ticketId: dto.ticketId, authorId: userId, body: dto.body, isInternal: dto.isInternal || false, authorType: dto.authorType || 'USER' },
      });
      if (dto.attachments && dto.attachments.length > 0) {
        await tx.saasSupportTicketAttachment.createMany({
          data: dto.attachments.map((a: any) => ({ tenantId, messageId: message.id, fileName: a.fileName, fileUrl: a.fileUrl, fileSize: a.fileSize || null, mimeType: a.mimeType || null })),
        });
      }
      return tx.saasSupportTicketMessage.findFirst({ where: { id: message.id }, include: { attachments: true } });
    });
  }

  // ═══ ANNOUNCEMENTS ═══

  async getAnnouncements(tenantId: string) {
    const now = new Date();
    return this.p.saasAnnouncement.findMany({
      where: { tenantId, isActive: true, startsAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAnnouncement(tenantId: string, dto: any, userId: string) {
    return this.p.saasAnnouncement.create({
      data: { tenantId, title: dto.title, body: dto.body, type: dto.type || 'INFO', severity: dto.severity || 'NORMAL', startsAt: new Date(dto.startsAt), expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null, createdBy: userId },
    });
  }

  async deleteAnnouncement(tenantId: string, id: string) {
    const ann = await this.p.saasAnnouncement.findFirst({ where: { id, tenantId } });
    if (!ann) throw new NotFoundException('Announcement not found');
    return this.p.saasAnnouncement.delete({ where: { id } });
  }

  // ═══ MAINTENANCE WINDOWS ═══

  async getMaintenanceWindows(tenantId: string) {
    return this.p.saasMaintenanceWindow.findMany({ where: { tenantId }, orderBy: { scheduledStart: 'desc' } });
  }

  async createMaintenanceWindow(tenantId: string, dto: any, userId: string) {
    return this.p.saasMaintenanceWindow.create({
      data: { tenantId, title: dto.title, description: dto.description || null, scheduledStart: new Date(dto.scheduledStart), scheduledEnd: new Date(dto.scheduledEnd), affectedServices: dto.affectedServices || [], notifyTenants: dto.notifyTenants !== false, createdBy: userId },
    });
  }

  async updateMaintenanceWindowStatus(tenantId: string, id: string, status: string) {
    const mw = await this.p.saasMaintenanceWindow.findFirst({ where: { id, tenantId } });
    if (!mw) throw new NotFoundException('Maintenance window not found');
    const updateData: any = { status };
    if (status === 'IN_PROGRESS') updateData.actualStart = new Date();
    if (status === 'COMPLETED') updateData.actualEnd = new Date();
    return this.p.saasMaintenanceWindow.update({ where: { id }, data: updateData });
  }

  // ═══ AUDIT HELPER ═══

  async logAudit(tenantId: string, actorId: string, action: string, resource?: string, resourceId?: string, details?: any, ipAddress?: string, userAgent?: string) {
    return this.p.saasAuditLog.create({
      data: { tenantId, actorId, action, resource, resourceId, details: details || null, ipAddress: ipAddress || null, userAgent: userAgent || null },
    });
  }
}
