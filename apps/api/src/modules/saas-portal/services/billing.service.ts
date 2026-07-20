import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Plans, pricing, payment methods, transactions, and coupons as consumed
 * from the SaaS Portal home. Consolidates the READ/ADMIN-FACING halves of
 * `modules/saas/plan-engine.{controller,service}.ts`,
 * `modules/saas/payment-methods.{controller,service}.ts`, and
 * `modules/saas/coupons-admin.controller.ts` (backed by `saas.service.ts`
 * coupon methods) into `/saas-portal/billing`.
 *
 * OUT OF SCOPE (per the phase-2 task boundary — do not touch): Stripe/webhook
 * signature verification lives in `modules/saas/billing-webhook.controller.ts`
 * and is neither read, modified, nor duplicated here. `saas.gateway.ts`
 * (realtime) is also untouched.
 *
 * DELEGATE-VS-DUPLICATE: `billing-admin.controller.ts` (analytics/reporting
 * over billing data) and `customer-billing.controller.ts`/
 * `billing-portal.controller.ts` (near-duplicates of payment-methods +
 * invoice-engine aimed at the self-service customer portal) were reviewed and
 * intentionally NOT reproduced in this pass — they are read-only reporting
 * views or near-exact duplicates of the payment-method/invoice surface
 * already consolidated here and in subscription.service.ts, and duplicating
 * them again would triple the same Prisma reads under a third route prefix
 * with no new business logic. The plans/pricing/features + payment-methods +
 * coupons surface below is the actual distinct, reusable business logic.
 * Independent implementation against the same Prisma models, not a
 * cross-module delegate (module-boundary hard-block, no port/event
 * abstraction for this data yet — same rationale as org-hierarchy).
 */
@Injectable()
export class SaasPortalBillingService {
  /* ── Plans ──────────────────────────────────────── */

  async listPlans() {
    return prisma.saaSPlan.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { sortOrder: 'asc' },
      include: { prices: { where: { isActive: true } }, featureEntitlements: { where: { isActive: true } } },
    });
  }

  async getPlan(id: string) {
    const plan = await prisma.saaSPlan.findUnique({
      where: { id },
      include: { prices: { where: { isActive: true } }, featureEntitlements: { where: { isActive: true } }, quotaRules: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(dto: {
    name: string; description?: string; price: number; currency?: string; interval?: string;
    maxUsers: number; maxStorage: number; maxApiCalls?: number; isActive?: boolean; sortOrder?: number; stripePriceId?: string;
  }) {
    const stripePriceId = dto.stripePriceId ?? `${dto.name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
    const existing = await prisma.saaSPlan.findUnique({ where: { stripePriceId } });
    if (existing) throw new ConflictException('Plan with this Stripe price ID already exists');

    return prisma.saaSPlan.create({
      data: {
        name: dto.name,
        stripePriceId,
        maxUsers: dto.maxUsers,
        maxStorage: dto.maxStorage,
        maxApiCalls: dto.maxApiCalls ?? 10000,
        features: [],
        description: dto.description,
        isPublic: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        prices: {
          create: {
            currency: dto.currency ?? 'USD',
            region: 'US',
            monthly: dto.interval === 'year' ? Math.round(dto.price / 12) : dto.price,
            yearly: dto.interval === 'year' ? dto.price : dto.price * 12,
          },
        },
      },
      include: { prices: true, featureEntitlements: true },
    });
  }

  async updatePlan(id: string, dto: {
    name?: string; description?: string; maxUsers?: number; maxStorage?: number; maxApiCalls?: number; isActive?: boolean; sortOrder?: number;
  }) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    return prisma.saaSPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
        ...(dto.maxStorage !== undefined && { maxStorage: dto.maxStorage }),
        ...(dto.maxApiCalls !== undefined && { maxApiCalls: dto.maxApiCalls }),
        ...(dto.isActive !== undefined && { isPublic: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: { prices: true, featureEntitlements: true },
    });
  }

  async deletePlan(id: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return prisma.saaSPlan.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async comparePlans(planIds: string[]) {
    const plans = await prisma.saaSPlan.findMany({
      where: { id: { in: planIds }, status: { not: 'ARCHIVED' } },
      include: { prices: { where: { isActive: true } }, featureEntitlements: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return plans.map((plan) => ({
      id: plan.id, name: plan.name, description: plan.description, maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage, maxApiCalls: plan.maxApiCalls, prices: plan.prices, features: plan.featureEntitlements,
    }));
  }

  async getRecommended(tenantId: string) {
    const usage = await prisma.usageRecord.findMany({ where: { tenantId } });
    const userCount = await prisma.user.count({ where: { tenantId } });
    const usageMap = new Map(usage.map((r) => [r.metric, r.currentValue]));
    const currentUsers = usageMap.get('USERS_COUNT') ?? userCount;
    const currentStorage = usageMap.get('STORAGE_MB') ?? 0;
    const currentApi = usageMap.get('API_CALLS_COUNT') ?? 0;

    const plans = await prisma.saaSPlan.findMany({
      where: { status: 'ACTIVE', isPublic: true },
      orderBy: { sortOrder: 'asc' },
      include: { prices: { where: { isActive: true, currency: 'USD', region: 'US' } }, featureEntitlements: { where: { isActive: true } } },
    });

    const scored = plans.map((plan) => {
      let score = 0;
      if (currentUsers <= plan.maxUsers) score += 30; else score -= (currentUsers - plan.maxUsers) * 5;
      if (currentStorage <= plan.maxStorage) score += 30; else score -= (currentStorage - plan.maxStorage) / 100;
      if (currentApi <= plan.maxApiCalls) score += 20; else score -= (currentApi - plan.maxApiCalls) / 1000;
      if (plan.featureEntitlements.length > 0) score += 10;
      return { plan, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0] ? scored[0].plan : null;
  }

  /* ── Plan Prices ────────────────────────────────── */

  async listPlanPrices(planId: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    return prisma.saaSPlanPrice.findMany({ where: { planId, isActive: true } });
  }

  async setPlanPrice(planId: string, dto: { amount: number; currency: string; interval: string; isActive?: boolean }) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const region = 'US';
    const existing = await prisma.saaSPlanPrice.findUnique({ where: { planId_currency_region: { planId, currency: dto.currency, region } } });
    if (existing) throw new ConflictException('Price already exists for this plan/currency/region');

    return prisma.saaSPlanPrice.create({
      data: {
        planId, currency: dto.currency, region,
        monthly: dto.interval === 'year' ? Math.round(dto.amount / 12) : dto.amount,
        yearly: dto.interval === 'year' ? dto.amount : dto.amount * 12,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePlanPrice(priceId: string, dto: { amount?: number; currency?: string; interval?: string; isActive?: boolean }) {
    const price = await prisma.saaSPlanPrice.findUnique({ where: { id: priceId } });
    if (!price) throw new NotFoundException('Plan price not found');

    const updateData: Record<string, unknown> = {};
    if (dto.amount !== undefined) {
      updateData.monthly = dto.interval === 'year' ? Math.round(dto.amount / 12) : dto.amount;
      updateData.yearly = dto.interval === 'year' ? dto.amount : dto.amount * 12;
    }
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return prisma.saaSPlanPrice.update({ where: { id: priceId }, data: updateData });
  }

  async deletePlanPrice(priceId: string) {
    const price = await prisma.saaSPlanPrice.findUnique({ where: { id: priceId } });
    if (!price) throw new NotFoundException('Plan price not found');
    return prisma.saaSPlanPrice.delete({ where: { id: priceId } });
  }

  /* ── Plan Features ──────────────────────────────── */

  async listPlanFeatures(planId: string) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    return prisma.saaSPlanFeature.findMany({ where: { planId, isActive: true } });
  }

  async addPlanFeature(planId: string, dto: { featureKey: string; featureName: string; featureType?: string; featureValue?: string; description?: string }) {
    const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const typeMap: Record<string, string> = { boolean: 'BOOLEAN', numeric: 'USAGE_LIMITED', text: 'BOOLEAN', select: 'BOOLEAN' };
    const existing = await prisma.saaSPlanFeature.findUnique({ where: { planId_featureKey: { planId, featureKey: dto.featureKey } } });
    if (existing) throw new ConflictException('Feature already exists for this plan');

    return prisma.saaSPlanFeature.create({
      data: {
        planId, featureKey: dto.featureKey, name: dto.featureName, description: dto.description,
        type: typeMap[dto.featureType ?? 'boolean'] ?? 'BOOLEAN',
        limitValue: dto.featureValue ? parseInt(dto.featureValue, 10) || null : null,
      },
    });
  }

  async updatePlanFeature(featureId: string, dto: { featureName?: string; featureType?: string; featureValue?: string; description?: string }) {
    const feature = await prisma.saaSPlanFeature.findUnique({ where: { id: featureId } });
    if (!feature) throw new NotFoundException('Plan feature not found');

    const typeMap: Record<string, string> = { boolean: 'BOOLEAN', numeric: 'USAGE_LIMITED', text: 'BOOLEAN', select: 'BOOLEAN' };
    const updateData: Record<string, unknown> = {};
    if (dto.featureName !== undefined) updateData.name = dto.featureName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.featureType !== undefined) updateData.type = typeMap[dto.featureType] ?? 'BOOLEAN';
    if (dto.featureValue !== undefined) updateData.limitValue = parseInt(dto.featureValue, 10) || null;

    return prisma.saaSPlanFeature.update({ where: { id: featureId }, data: updateData });
  }

  async removePlanFeature(featureId: string) {
    const feature = await prisma.saaSPlanFeature.findUnique({ where: { id: featureId } });
    if (!feature) throw new NotFoundException('Plan feature not found');
    return prisma.saaSPlanFeature.delete({ where: { id: featureId } });
  }

  /* ── Payment Methods ────────────────────────────── */

  async listPaymentMethods(tenantId: string) {
    return prisma.paymentMethod.findMany({ where: { tenantId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  async addPaymentMethod(tenantId: string, dto: { type: string; token: string; isDefault: boolean; cardLast4?: string; cardBrand?: string }) {
    if (dto.isDefault) {
      await prisma.paymentMethod.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
    }
    return prisma.paymentMethod.create({
      data: {
        tenantId,
        provider: dto.type === 'card' ? 'STRIPE' : dto.type.toUpperCase(),
        providerPaymentMethodId: dto.token,
        cardBrand: dto.cardBrand,
        cardLast4: dto.cardLast4,
        isDefault: dto.isDefault,
      },
    });
  }

  async setDefaultPaymentMethod(tenantId: string, id: string) {
    const pm = await prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!pm) throw new NotFoundException('Payment method not found');
    await prisma.paymentMethod.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
    return prisma.paymentMethod.update({ where: { id }, data: { isDefault: true } });
  }

  async removePaymentMethod(tenantId: string, id: string) {
    const pm = await prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!pm) throw new NotFoundException('Payment method not found');
    return prisma.paymentMethod.delete({ where: { id } });
  }

  /* ── Transactions ───────────────────────────────── */

  async listTransactions(tenantId: string) {
    return prisma.paymentTransaction.findMany({ where: { tenantId }, include: { invoice: true, paymentMethod: true }, orderBy: { createdAt: 'desc' } });
  }

  async getTransaction(tenantId: string, id: string) {
    const tx = await prisma.paymentTransaction.findFirst({ where: { id, tenantId }, include: { invoice: { include: { lines: true } }, paymentMethod: true } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async requestRefund(tenantId: string, transactionId: string, body: { amount?: number; reason?: string }) {
    const tx = await prisma.paymentTransaction.findFirst({ where: { id: transactionId, tenantId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'SUCCEEDED') throw new BadRequestException('Only successful transactions can be refunded');

    return prisma.$transaction([
      prisma.paymentTransaction.update({ where: { id: transactionId }, data: { status: 'REFUNDED' } }),
      prisma.paymentTransaction.create({
        data: {
          tenantId, invoiceId: tx.invoiceId, provider: tx.provider, type: 'REFUND', status: 'SUCCEEDED',
          amount: body.amount ?? tx.amount, currency: tx.currency, description: body.reason ?? `Refund of transaction ${transactionId}`,
        },
      }),
    ]);
  }

  async getPaymentStats(tenantId: string) {
    const transactions = await prisma.paymentTransaction.findMany({ where: { tenantId }, select: { status: true, amount: true, type: true } });
    const succeededCount = transactions.filter((t) => t.status === 'SUCCEEDED').length;
    const totalSucceeded = transactions.filter((t) => t.status === 'SUCCEEDED').reduce((s, t) => s + Number(t.amount), 0);

    return {
      totalTransactions: transactions.length,
      succeededCount,
      failedCount: transactions.filter((t) => t.status === 'FAILED').length,
      pendingCount: transactions.filter((t) => t.status === 'PENDING').length,
      refundedCount: transactions.filter((t) => t.status === 'REFUNDED').length,
      totalSucceeded,
      totalFailed: transactions.filter((t) => t.status === 'FAILED').reduce((s, t) => s + Number(t.amount), 0),
      successRate: transactions.length > 0 ? Math.round((succeededCount / transactions.length) * 100) : 0,
    };
  }

  /* ── Coupons ────────────────────────────────────── */

  async listCoupons() {
    return prisma.saaSCoupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getCoupon(id: string) {
    const coupon = await prisma.saaSCoupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async createCoupon(dto: { code: string; description?: string; discountType: string; discountValue: number; maxRedemptions?: number; expiresAt?: string }) {
    const existing = await prisma.saaSCoupon.findUnique({ where: { code: dto.code } }).catch(() => null);
    if (existing) throw new ConflictException('Coupon code already exists');
    return prisma.saaSCoupon.create({
      data: {
        code: dto.code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
      },
    });
  }

  async updateCoupon(
    id: string,
    dto: { code?: string; description?: string; discountType?: string; discountValue?: number; maxRedemptions?: number; expiresAt?: string },
  ) {
    const coupon = await prisma.saaSCoupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    // Whitelist only the client-updatable fields — never spread an
    // unvalidated body directly; status/timesRedeemed etc. are never
    // client-settable here.
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) data.discountValue = dto.discountValue;
    if (dto.maxRedemptions !== undefined) data.maxRedemptions = dto.maxRedemptions;
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt);
    return prisma.saaSCoupon.update({ where: { id }, data });
  }

  async deleteCoupon(id: string) {
    const coupon = await prisma.saaSCoupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return prisma.saaSCoupon.delete({ where: { id } });
  }

  async setCouponStatus(id: string, status: 'ACTIVE' | 'DISABLED') {
    const coupon = await prisma.saaSCoupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return prisma.saaSCoupon.update({ where: { id }, data: { status } });
  }

  async getCouponStats() {
    const coupons = await this.listCoupons();
    const total = coupons.length;
    const totalRedeemed = coupons.reduce((s, c: any) => s + (c.timesRedeemed || 0), 0);
    return { total, activeCount: coupons.filter((c: any) => c.status !== 'DISABLED').length, totalRedeemed };
  }

  async bulkCreateCoupons(dto: { codes: string[]; discountType: string; discountValue: number }) {
    const results: any[] = [];
    for (const code of dto.codes) {
      try {
        const c = await this.createCoupon({ code, discountType: dto.discountType, discountValue: dto.discountValue });
        results.push(c);
      } catch {
        results.push({ code, error: 'duplicate' });
      }
    }
    return { created: results.filter((r) => !r.error).length, duplicates: results.filter((r) => r.error).length, results };
  }
}
