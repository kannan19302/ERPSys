import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
    // ── Subscription CRUD ──────────────────────────────────────────

    async findAll(tenantId: string, query: { page?: string; limit?: string; status?: string; sortBy?: string; sortOrder?: string; search?: string }) {
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);
        const skip = (page - 1) * limit;
        const status = query.status;
        const search = query.search;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = (query.sortOrder || 'desc') as Prisma.SortOrder;

        const where: Prisma.SubscriptionWhereInput = { tenantId };
        if (status) where.status = status;
        if (search) where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];

        const [items, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
                include: { lines: true, _count: { select: { invoices: true, usage: true } } },
            }),
            prisma.subscription.count({ where }),
        ]);

        return { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async findById(tenantId: string, id: string) {
        const sub = await prisma.subscription.findFirst({
            where: { id, tenantId },
            include: {
                lines: true,
                invoices: { orderBy: { sequenceNumber: 'desc' }, take: 12 },
                usage: { orderBy: { usageDate: 'desc' }, take: 50 },
            },
        });
        if (!sub) throw new NotFoundException('Subscription not found');
        return sub;
    }

    async create(tenantId: string, orgId: string, dto: {
        name: string; description?: string; customerId?: string; productId?: string;
        currency?: string; unitAmount: number; quantity?: number;
        billingPeriod?: string; billingCycles?: number;
        startDate: string; trialEndDate?: string;
        lines?: Array<{ description: string; unitAmount: number; quantity?: number; taxRate?: number }>;
    }) {
        const startDate = new Date(dto.startDate);
        const periodEnd = this.calculatePeriodEnd(startDate, dto.billingPeriod || 'MONTHLY');

        const sub = await prisma.subscription.create({
            data: {
                tenantId,
                orgId,
                name: dto.name,
                description: dto.description,
                customerId: dto.customerId,
                productId: dto.productId,
                currency: dto.currency || 'USD',
                unitAmount: new Prisma.Decimal(dto.unitAmount),
                quantity: dto.quantity || 1,
                billingPeriod: dto.billingPeriod || 'MONTHLY',
                billingCycles: dto.billingCycles ?? null,
                status: dto.trialEndDate ? 'TRIALING' : 'ACTIVE',
                startDate,
                currentPeriodStart: startDate,
                currentPeriodEnd: periodEnd,
                trialEndDate: dto.trialEndDate ? new Date(dto.trialEndDate) : null,
                lines: dto.lines ? {
                    create: dto.lines.map(l => ({
                        tenantId,
                        description: l.description,
                        unitAmount: new Prisma.Decimal(l.unitAmount),
                        quantity: l.quantity || 1,
                        taxRate: new Prisma.Decimal(l.taxRate || 0),
                        totalAmount: new Prisma.Decimal((l.unitAmount * (l.quantity || 1)) * (1 + (l.taxRate || 0) / 100)),
                    })),
                } : undefined,
            },
            include: { lines: true },
        });

        return sub;
    }

    async update(tenantId: string, id: string, dto: Partial<{
        name: string; description?: string; unitAmount?: number; quantity?: number;
        billingPeriod?: string; status?: string; metadata?: Record<string, unknown>;
        cancelAtPeriodEnd?: boolean;
    }>) {
        const sub = await prisma.subscription.findFirst({ where: { id, tenantId } });
        if (!sub) throw new NotFoundException('Subscription not found');

        const updateData: Record<string, unknown> = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.unitAmount !== undefined) updateData.unitAmount = new Prisma.Decimal(dto.unitAmount);
        if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
        if (dto.billingPeriod !== undefined) updateData.billingPeriod = dto.billingPeriod;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
        if (dto.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;

        return prisma.subscription.update({
            where: { id },
            data: updateData,
            include: { lines: true },
        });
    }

    async delete(tenantId: string, id: string) {
        const sub = await prisma.subscription.findFirst({ where: { id, tenantId } });
        if (!sub) throw new NotFoundException('Subscription not found');
        await prisma.subscription.update({ where: { id }, data: { status: 'CANCELED', canceledAt: new Date() } });
        return { success: true };
    }

    // ── Subscription Lifecycle ─────────────────────────────────────

    async pause(tenantId: string, id: string) {
        const sub = await prisma.subscription.findFirst({ where: { id, tenantId, status: 'ACTIVE' } });
        if (!sub) throw new NotFoundException('Active subscription not found');
        return prisma.subscription.update({ where: { id }, data: { status: 'PAUSED', pausedAt: new Date() } });
    }

    async resume(tenantId: string, id: string) {
        const sub = await prisma.subscription.findFirst({ where: { id, tenantId, status: 'PAUSED' } });
        if (!sub) throw new NotFoundException('Paused subscription not found');
        return prisma.subscription.update({ where: { id }, data: { status: 'ACTIVE', pausedAt: null } });
    }

    async cancel(tenantId: string, id: string, immediate?: boolean) {
        const sub = await prisma.subscription.findFirst({ where: { id, tenantId, status: { in: ['ACTIVE', 'TRIALING', 'PAUSED'] } } });
        if (!sub) throw new NotFoundException('Active/Trialing subscription not found');

        if (immediate) {
            return prisma.subscription.update({ where: { id }, data: { status: 'CANCELED', canceledAt: new Date() } });
        }
        return prisma.subscription.update({ where: { id }, data: { cancelAtPeriodEnd: true } });
    }

    // ── Billing Run ────────────────────────────────────────────────

    async runBilling(tenantId: string) {
        const due = await prisma.subscription.findMany({
            where: {
                tenantId,
                status: { in: ['ACTIVE', 'TRIALING'] },
                currentPeriodEnd: { lte: new Date() },
                OR: [
                    { billingCycles: null },
                    { billingCycles: { gt: 0 } },
                ],
            },
            include: { lines: true },
        });

        const results: Array<{ subscriptionId: string; name: string; invoiceNumber?: string; status: string }> = [];

        for (const sub of due) {
            try {
                // Check if still in trial
                if (sub.trialEndDate && new Date(sub.trialEndDate) > new Date()) {
                    // Just advance period, don't bill
                    const newStart = new Date(sub.currentPeriodEnd);
                    const newEnd = this.calculatePeriodEnd(newStart, sub.billingPeriod);
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: { currentPeriodStart: newStart, currentPeriodEnd: newEnd, trialEndDate: null, status: 'ACTIVE' },
                    });
                    results.push({ subscriptionId: sub.id, name: sub.name, status: 'TRIAL_ADVANCED' });
                    continue;
                }

                // Calculate amount
                let totalAmount = Number(sub.unitAmount) * sub.quantity;
                if (sub.lines?.length) {
                    totalAmount = sub.lines.reduce((sum, l) => sum + Number(l.totalAmount), 0);
                }

                // Create invoice
                const orgId = sub.orgId;
                const invoiceCount = await prisma.invoice.count({ where: { tenantId, orgId } });
                const invoiceNumber = `SUB-${orgId.slice(-4)}-${(invoiceCount + 1).toString().padStart(5, '0')}`;

                const invoice = await prisma.invoice.create({
                    data: {
                        tenantId,
                        orgId,
                        customerId: sub.customerId || '',
                        invoiceNumber,
                        status: 'DRAFT',
                        issueDate: new Date(),
                        dueDate: new Date(Date.now() + 30 * 86400000),
                        subtotal: new Prisma.Decimal(totalAmount),
                        taxAmount: new Prisma.Decimal(0),
                        totalAmount: new Prisma.Decimal(totalAmount),
                        paidAmount: new Prisma.Decimal(0),
                        currency: sub.currency,
                        exchangeRate: new Prisma.Decimal(1),
                        notes: `Auto-generated for subscription ${sub.name}`,
                        createdBy: 'system',
                    },
                });

                // Link invoice to subscription
                const seqNum = (sub._count?.invoices ?? await prisma.subscriptionInvoice.count({ where: { subscriptionId: sub.id } })) + 1;
                await prisma.subscriptionInvoice.create({
                    data: {
                        tenantId,
                        subscriptionId: sub.id,
                        invoiceId: invoice.id,
                        periodStart: sub.currentPeriodStart,
                        periodEnd: sub.currentPeriodEnd,
                        sequenceNumber: seqNum,
                        status: 'PENDING',
                        amount: new Prisma.Decimal(totalAmount),
                    },
                });

                // Advance period
                const newStart = new Date(sub.currentPeriodEnd);
                const newEnd = this.calculatePeriodEnd(newStart, sub.billingPeriod);

                const updateData: Record<string, unknown> = {
                    currentPeriodStart: newStart,
                    currentPeriodEnd: newEnd,
                };

                // Decrement billing cycles if finite
                if (sub.billingCycles !== null && sub.billingCycles !== undefined) {
                    const remaining = sub.billingCycles - 1;
                    if (remaining <= 0) {
                        updateData.status = 'EXPIRED';
                    }
                    updateData.billingCycles = remaining;
                }

                await prisma.subscription.update({ where: { id: sub.id }, data: updateData });

                results.push({ subscriptionId: sub.id, name: sub.name, invoiceNumber: invoice.invoiceNumber, status: 'BILLED' });
            } catch (err) {
                results.push({ subscriptionId: sub.id, name: sub.name, status: `ERROR: ${err instanceof Error ? err.message : 'Unknown'}` });
            }
        }

        return { processed: due.length, billed: results.filter(r => r.status === 'BILLED').length, results };
    }

    // ── MRR/ARR/Churn Metrics ──────────────────────────────────────

    async getMetrics(tenantId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);

        const [activeSubs, newThisMonth, churnedThisMonth, allActive] = await Promise.all([
            prisma.subscription.findMany({
                where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
            }),
            prisma.subscription.count({
                where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELED' } },
            }),
            prisma.subscription.count({
                where: { tenantId, canceledAt: { gte: monthStart, lte: monthEnd } },
            }),
            prisma.subscription.findMany({
                where: { tenantId, status: 'ACTIVE' },
                select: { unitAmount: true, quantity: true, billingPeriod: true, lines: { select: { totalAmount: true } } },
            }),
        ]);

        const prevMonthActive = await prisma.subscription.count({
            where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] }, createdAt: { lt: monthStart } },
        });

        // MRR: normalize all active subs to monthly
        let mrr = 0;
        for (const sub of allActive) {
            const amount = sub.lines?.length
                ? sub.lines.reduce((s, l) => s + Number(l.totalAmount), 0)
                : Number(sub.unitAmount) * sub.quantity;
            switch (sub.billingPeriod) {
                case 'ANNUAL': mrr += amount / 12; break;
                case 'SEMI_ANNUAL': mrr += amount / 6; break;
                case 'QUARTERLY': mrr += amount / 3; break;
                default: mrr += amount; // MONTHLY
            }
        }

        const arr = mrr * 12;
        const churnRate = prevMonthActive > 0 ? (churnedThisMonth / prevMonthActive) * 100 : 0;
        const totalActiveSubs = activeSubs.length;
        const avgRevenuePerSub = totalActiveSubs > 0 ? arr / totalActiveSubs : 0;

        return {
            mrr: Math.round(mrr * 100) / 100,
            arr: Math.round(arr * 100) / 100,
            totalActiveSubs,
            newSubsThisMonth: newThisMonth,
            churnedThisMonth,
            churnRate: Math.round(churnRate * 100) / 100,
            avgRevenuePerSub: Math.round(avgRevenuePerSub * 100) / 100,
            monthlyGrowth: newThisMonth - churnedThisMonth,
        };
    }

    // ── Usage Tracking ────────────────────────────────────────────

    async recordUsage(tenantId: string, subscriptionId: string, dto: { usageDate: string; metricName: string; quantity: number; unitAmount: number }) {
        const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, tenantId } });
        if (!sub) throw new NotFoundException('Subscription not found');

        const totalAmount = dto.quantity * dto.unitAmount;
        return prisma.subscriptionUsage.create({
            data: {
                tenantId,
                subscriptionId,
                usageDate: new Date(dto.usageDate),
                metricName: dto.metricName,
                quantity: dto.quantity,
                unitAmount: new Prisma.Decimal(dto.unitAmount),
                totalAmount: new Prisma.Decimal(totalAmount),
            },
        });
    }

    async getUsage(tenantId: string, subscriptionId: string, metricName?: string) {
        const where: Prisma.SubscriptionUsageWhereInput = { tenantId, subscriptionId };
        if (metricName) where.metricName = metricName;
        return prisma.subscriptionUsage.findMany({
            where,
            orderBy: { usageDate: 'desc' },
            take: 200,
        });
    }

    async getUsageSummary(tenantId: string, subscriptionId: string) {
        const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, tenantId } });
        if (!sub) throw new NotFoundException('Subscription not found');

        const rows = await prisma.subscriptionUsage.groupBy({
            by: ['metricName'],
            where: { tenantId, subscriptionId },
            _sum: { quantity: true, totalAmount: true },
        });

        return rows.map(r => ({
            metricName: r.metricName,
            totalQuantity: r._sum.quantity || 0,
            totalAmount: Number(r._sum.totalAmount || 0),
        }));
    }

    // ── Helpers ───────────────────────────────────────────────────

    private calculatePeriodEnd(start: Date, period: string): Date {
        const end = new Date(start);
        switch (period) {
            case 'WEEKLY': end.setDate(end.getDate() + 7); break;
            case 'MONTHLY': end.setMonth(end.getMonth() + 1); break;
            case 'QUARTERLY': end.setMonth(end.getMonth() + 3); break;
            case 'SEMI_ANNUAL': end.setMonth(end.getMonth() + 6); break;
            case 'ANNUAL': end.setFullYear(end.getFullYear() + 1); break;
            default: end.setMonth(end.getMonth() + 1);
        }
        return end;
    }

    async getStats(tenantId: string) {
        const [total, byStatus] = await Promise.all([
            prisma.subscription.count({ where: { tenantId } }),
            prisma.subscription.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: true,
            }),
        ]);
        return { total, byStatus: byStatus.map(s => ({ status: s.status, count: s._count })) };
    }
}