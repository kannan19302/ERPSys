import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../../common/guards/tenant.interceptor';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../../common/interceptors/change-history.interceptor';
import { SaasPortalBillingService } from '../services/billing.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; firstName: string; lastName: string; roles: string[] };
}

const createPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  interval: z.enum(['month', 'year', 'week', 'day']).default('month'),
  maxUsers: z.number().int().min(1),
  maxStorage: z.number().int().min(0),
  maxApiCalls: z.number().int().min(0).default(10000),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});
const updatePlanSchema = createPlanSchema.partial();

const setPriceSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().min(1),
  interval: z.enum(['month', 'year', 'week', 'day']),
  isActive: z.boolean().default(true),
});
const updatePriceSchema = setPriceSchema.partial();

const addFeatureSchema = z.object({
  featureKey: z.string().min(1).max(100),
  featureName: z.string().min(1).max(255),
  featureType: z.enum(['boolean', 'numeric', 'text', 'select']).default('boolean'),
  featureValue: z.string().optional(),
  description: z.string().optional(),
});
const updateFeatureSchema = addFeatureSchema.partial();

const addPaymentMethodSchema = z.object({
  type: z.enum(['card', 'bank', 'paypal', 'stripe']),
  token: z.string().min(1),
  isDefault: z.boolean().default(false),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
});

const refundSchema = z.object({ amount: z.number().min(0).optional(), reason: z.string().optional() });

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed', 'free_trial']),
  discountValue: z.number().min(0),
  maxRedemptions: z.number().int().min(0).default(0),
  expiresAt: z.string().datetime().optional(),
});
const updateCouponSchema = createCouponSchema.partial();

const bulkCreateCouponsSchema = z.object({
  codes: z.array(z.string().min(1)).min(1).max(100),
  discountType: z.enum(['percentage', 'fixed', 'free_trial']),
  discountValue: z.number().min(0),
});

/**
 * SaaS Portal home for plans/pricing/features, payment methods, transactions,
 * and coupons. See services/billing.service.ts header for the full
 * delegate-vs-duplicate rationale (billing-webhook.controller.ts is out of
 * scope and untouched; billing-admin/customer-billing/billing-portal are
 * reporting views or near-duplicates intentionally not reproduced here).
 * Independent implementation, not a cross-module delegate. Reuses the
 * existing `saas.plan.*`, `saas.pricing.*`, `saas.payment.*`, and
 * `saas.coupon.*` permission codes.
 */
@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal/billing')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SaasPortalBillingController {
  constructor(private readonly billingService: SaasPortalBillingService) {}

  /* ── Plans ──────────────────────────────────────── */

  @ApiOperation({ summary: 'List plans' })
  @Permissions('saas.plan.read')
  @Get('plans')
  async listPlans() {
    return this.billingService.listPlans();
  }

  @ApiOperation({ summary: 'Get plan comparison' })
  @Permissions('saas.plan.read')
  @Get('plans/comparison')
  async comparePlans(@Query('ids') ids?: string) {
    const planIds = ids ? ids.split(',').map((s) => s.trim()) : [];
    return this.billingService.comparePlans(planIds);
  }

  @ApiOperation({ summary: 'Get recommended plan' })
  @Permissions('saas.plan.read')
  @Get('plans/recommended')
  async getRecommended(@Req() req: AuthenticatedRequest) {
    return this.billingService.getRecommended(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get plan' })
  @Permissions('saas.plan.read')
  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.billingService.getPlan(id);
  }

  @ApiOperation({ summary: 'Create plan' })
  @Permissions('saas.plan.create')
  @Post('plans')
  @TrackChanges('SaaSPlan')
  @UseInterceptors(ChangeHistoryInterceptor)
  async createPlan(@ZodBody(createPlanSchema) body: z.infer<typeof createPlanSchema>) {
    return this.billingService.createPlan(body);
  }

  @ApiOperation({ summary: 'Update plan' })
  @Permissions('saas.plan.update')
  @Patch('plans/:id')
  @TrackChanges('SaaSPlan')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updatePlan(@Param('id') id: string, @ZodBody(updatePlanSchema) body: z.infer<typeof updatePlanSchema>) {
    return this.billingService.updatePlan(id, body);
  }

  @ApiOperation({ summary: 'Delete (archive) plan' })
  @Permissions('saas.plan.delete')
  @Delete('plans/:id')
  @TrackChanges('SaaSPlan')
  @UseInterceptors(ChangeHistoryInterceptor)
  async deletePlan(@Param('id') id: string) {
    return this.billingService.deletePlan(id);
  }

  /* ── Plan Prices ────────────────────────────────── */

  @ApiOperation({ summary: 'List plan prices' })
  @Permissions('saas.pricing.read')
  @Get('plans/:id/prices')
  async listPlanPrices(@Param('id') id: string) {
    return this.billingService.listPlanPrices(id);
  }

  @ApiOperation({ summary: 'Set plan price' })
  @Permissions('saas.pricing.create')
  @Post('plans/:id/prices')
  @TrackChanges('SaaSPlanPrice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async setPlanPrice(@Param('id') id: string, @ZodBody(setPriceSchema) body: z.infer<typeof setPriceSchema>) {
    return this.billingService.setPlanPrice(id, body);
  }

  @ApiOperation({ summary: 'Update plan price' })
  @Permissions('saas.pricing.update')
  @Patch('prices/:priceId')
  @TrackChanges('SaaSPlanPrice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updatePlanPrice(@Param('priceId') priceId: string, @ZodBody(updatePriceSchema) body: z.infer<typeof updatePriceSchema>) {
    return this.billingService.updatePlanPrice(priceId, body);
  }

  @ApiOperation({ summary: 'Delete plan price' })
  @Permissions('saas.pricing.delete')
  @Delete('prices/:priceId')
  @TrackChanges('SaaSPlanPrice')
  @UseInterceptors(ChangeHistoryInterceptor)
  async deletePlanPrice(@Param('priceId') priceId: string) {
    return this.billingService.deletePlanPrice(priceId);
  }

  /* ── Plan Features ──────────────────────────────── */

  @ApiOperation({ summary: 'List plan features' })
  @Permissions('saas.plan.read')
  @Get('plans/:id/features')
  async listPlanFeatures(@Param('id') id: string) {
    return this.billingService.listPlanFeatures(id);
  }

  @ApiOperation({ summary: 'Add plan feature' })
  @Permissions('saas.plan.update')
  @Post('plans/:id/features')
  async addPlanFeature(@Param('id') id: string, @ZodBody(addFeatureSchema) body: z.infer<typeof addFeatureSchema>) {
    return this.billingService.addPlanFeature(id, body);
  }

  @ApiOperation({ summary: 'Update plan feature' })
  @Permissions('saas.plan.update')
  @Patch('features/:featureId')
  async updatePlanFeature(@Param('featureId') featureId: string, @ZodBody(updateFeatureSchema) body: z.infer<typeof updateFeatureSchema>) {
    return this.billingService.updatePlanFeature(featureId, body);
  }

  @ApiOperation({ summary: 'Remove plan feature' })
  @Permissions('saas.plan.update')
  @Delete('features/:featureId')
  async removePlanFeature(@Param('featureId') featureId: string) {
    return this.billingService.removePlanFeature(featureId);
  }

  /* ── Payment Methods ────────────────────────────── */

  @ApiOperation({ summary: 'List payment methods' })
  @Permissions('saas.payment.read')
  @Get('payment-methods')
  async listPaymentMethods(@Req() req: AuthenticatedRequest) {
    return this.billingService.listPaymentMethods(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Add payment method' })
  @Permissions('saas.payment.create')
  @Post('payment-methods')
  @TrackChanges('PaymentMethod')
  @UseInterceptors(ChangeHistoryInterceptor)
  async addPaymentMethod(@Req() req: AuthenticatedRequest, @ZodBody(addPaymentMethodSchema) body: z.infer<typeof addPaymentMethodSchema>) {
    return this.billingService.addPaymentMethod(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Set default payment method' })
  @Permissions('saas.payment.read')
  @Patch('payment-methods/:id/default')
  @TrackChanges('PaymentMethod')
  @UseInterceptors(ChangeHistoryInterceptor)
  async setDefaultPaymentMethod(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.billingService.setDefaultPaymentMethod(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Remove payment method' })
  @Permissions('saas.payment.delete')
  @Delete('payment-methods/:id')
  @TrackChanges('PaymentMethod')
  @UseInterceptors(ChangeHistoryInterceptor)
  async removePaymentMethod(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.billingService.removePaymentMethod(req.user.tenantId, id);
  }

  /* ── Transactions ───────────────────────────────── */

  @ApiOperation({ summary: 'List transactions' })
  @Permissions('saas.payment.read')
  @Get('transactions')
  async listTransactions(@Req() req: AuthenticatedRequest) {
    return this.billingService.listTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get payment stats' })
  @Permissions('saas.payment.read')
  @Get('transactions/stats')
  async getPaymentStats(@Req() req: AuthenticatedRequest) {
    return this.billingService.getPaymentStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get transaction' })
  @Permissions('saas.payment.read')
  @Get('transactions/:id')
  async getTransaction(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.billingService.getTransaction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Request refund' })
  @Permissions('saas.payment.create')
  @Post('transactions/:id/refund')
  async requestRefund(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(refundSchema) body: z.infer<typeof refundSchema>) {
    return this.billingService.requestRefund(req.user.tenantId, id, body);
  }

  /* ── Coupons ────────────────────────────────────── */

  @ApiOperation({ summary: 'List coupons' })
  @Permissions('saas.coupon.read')
  @Get('coupons')
  async listCoupons() {
    return this.billingService.listCoupons();
  }

  @ApiOperation({ summary: 'Get coupon stats' })
  @Permissions('saas.coupon.read')
  @Get('coupons/stats')
  async getCouponStats() {
    return this.billingService.getCouponStats();
  }

  @ApiOperation({ summary: 'Get coupon' })
  @Permissions('saas.coupon.read')
  @Get('coupons/:id')
  async getCoupon(@Param('id') id: string) {
    return this.billingService.getCoupon(id);
  }

  @ApiOperation({ summary: 'Create coupon' })
  @Permissions('saas.coupon.create')
  @Post('coupons')
  @TrackChanges('SaaSCoupon')
  @UseInterceptors(ChangeHistoryInterceptor)
  async createCoupon(@ZodBody(createCouponSchema) body: z.infer<typeof createCouponSchema>) {
    return this.billingService.createCoupon(body);
  }

  @ApiOperation({ summary: 'Bulk create coupons' })
  @Permissions('saas.coupon.create')
  @Post('coupons/bulk-create')
  async bulkCreateCoupons(@ZodBody(bulkCreateCouponsSchema) body: z.infer<typeof bulkCreateCouponsSchema>) {
    return this.billingService.bulkCreateCoupons(body);
  }

  @ApiOperation({ summary: 'Update coupon' })
  @Permissions('saas.coupon.update')
  @Patch('coupons/:id')
  @TrackChanges('SaaSCoupon')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateCoupon(@Param('id') id: string, @ZodBody(updateCouponSchema) body: z.infer<typeof updateCouponSchema>) {
    return this.billingService.updateCoupon(id, body);
  }

  @ApiOperation({ summary: 'Delete coupon' })
  @Permissions('saas.coupon.delete')
  @Delete('coupons/:id')
  @TrackChanges('SaaSCoupon')
  @UseInterceptors(ChangeHistoryInterceptor)
  async deleteCoupon(@Param('id') id: string) {
    return this.billingService.deleteCoupon(id);
  }

  @ApiOperation({ summary: 'Disable coupon' })
  @Permissions('saas.coupon.update')
  @Post('coupons/:id/disable')
  async disableCoupon(@Param('id') id: string) {
    return this.billingService.setCouponStatus(id, 'DISABLED');
  }

  @ApiOperation({ summary: 'Enable coupon' })
  @Permissions('saas.coupon.update')
  @Post('coupons/:id/enable')
  async enableCoupon(@Param('id') id: string) {
    return this.billingService.setCouponStatus(id, 'ACTIVE');
  }
}
