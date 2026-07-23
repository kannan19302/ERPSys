import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Body, Query } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { SalesCpqService } from "./sales-cpq.service";
import { SalesCpqExtensionService } from "./sales-cpq-extension.service";
import { createProductBundleSchema, updateProductBundleSchema, createCrossSellRuleSchema, createUpsellRuleSchema, validateConfigurationSchema, CreateProductBundleDto, UpdateProductBundleDto, CreateCrossSellRuleDto, CreateUpsellRuleDto, ValidateConfigurationDto } from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request { user: { tenantId: string; userId: string; orgId?: string } }

@ApiTags("sales")
@ApiBearerAuth()
@Controller("sales/cpq")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesCpqController {
  constructor(
    private readonly cpqService: SalesCpqService,
    private readonly cpqExtService: SalesCpqExtensionService,
  ) {}

  // ── Product Configurator ──
  @Get("products/:productId/configuration")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Get product configurator options" })
  async getConfiguration(@Req() req: AuthReq, @Param("productId") productId: string) {
    return this.cpqService.getProductConfiguration(req.user.tenantId, productId);
  }

  @Post("products/:productId/validate")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Validate product configuration" })
  async validateConfiguration(@Req() req: AuthReq, @Param("productId") productId: string, @ZodBody(validateConfigurationSchema) dto: ValidateConfigurationDto) {
    return this.cpqExtService.validateConfiguration(req.user.tenantId, productId, dto);
  }

  // ── Dynamic Pricing ──
  @Post("calculate-price")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Calculate dynamic price with rules" })
  async calculatePrice(@Req() req: AuthReq, @Body() body: { productId: string; quantity: number; customerId?: string; priceBookId?: string; currency?: string }) {
    return this.cpqService.calculateDynamicPrice(req.user.tenantId, body);
  }

  @Post("calculate-subscription")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Calculate subscription price" })
  async calcSubscription(@Req() req: AuthReq, @Body() body: { productId: string; termMonths: number; billingFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL"; quantity: number }) {
    return this.cpqService.calculateSubscriptionPrice(req.user.tenantId, body);
  }

  @Post("calculate-tax")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Calculate tax" })
  async calcTax(@Req() req: AuthReq, @Body() body: { lineItems: Array<{ amount: number; productType: string }>; shipToState: string; shipToCountry: string }) {
    return this.cpqService.calculateTax(req.user.tenantId, body);
  }

  @Post("estimate-shipping")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Estimate shipping cost" })
  async estimateShipping(@Req() req: AuthReq, @Body() body: { weight: number; dimensions: { length: number; width: number; height: number }; originZip: string; destinationZip: string; carrier?: string }) {
    return this.cpqService.estimateShipping(req.user.tenantId, body);
  }

  // ── Discount Approval ──
  @Post("discount-approval")
  @Permissions("sales.cpq.create")
  @ApiOperation({ summary: "Check discount approval thresholds" })
  async discountApproval(@Req() req: AuthReq, @Body() body: { quotationId: string; discount: number }) {
    return this.cpqService.requestDiscountApproval(req.user.tenantId, body.quotationId, body.discount, req.user.userId);
  }

  // ── Margin Analysis ──
  @Get("margin-analysis/:quotationId")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Get margin analysis for quote" })
  async marginAnalysis(@Req() req: AuthReq, @Param("quotationId") quotationId: string) {
    return this.cpqService.getQuoteMarginAnalysis(req.user.tenantId, quotationId);
  }

  // ── Quote Analytics ──
  @Get("analytics")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Get CPQ analytics" })
  async analytics(@Req() req: AuthReq) {
    return this.cpqService.getQuoteAnalytics(req.user.tenantId);
  }

  @Get("profitability-dashboard")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Get quote profitability dashboard" })
  async profitability(@Req() req: AuthReq) {
    return this.cpqService.getQuoteProfitabilityDashboard(req.user.tenantId);
  }

  // ── Product Bundles ──
  @Get("bundles")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "List product bundles" })
  async getBundles(@Req() req: AuthReq) {
    return this.cpqExtService.getBundles(req.user.tenantId);
  }

  @Get("bundles/:id")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Get bundle by id" })
  async getBundleById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.cpqExtService.getBundleById(req.user.tenantId, id);
  }

  @Post("bundles")
  @Permissions("sales.cpq.create")
  @ApiOperation({ summary: "Create product bundle" })
  async createBundle(@Req() req: AuthReq, @ZodBody(createProductBundleSchema) dto: CreateProductBundleDto) {
    return this.cpqExtService.createBundle(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("bundles/:id")
  @Permissions("sales.cpq.update")
  @ApiOperation({ summary: "Update product bundle" })
  async updateBundle(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateProductBundleSchema) dto: UpdateProductBundleDto) {
    return this.cpqExtService.updateBundle(req.user.tenantId, id, dto);
  }

  @Delete("bundles/:id")
  @Permissions("sales.cpq.delete")
  @ApiOperation({ summary: "Delete product bundle" })
  async deleteBundle(@Req() req: AuthReq, @Param("id") id: string) {
    return this.cpqExtService.deleteBundle(req.user.tenantId, id);
  }

  // ── Cross-sell / Upsell Rules ──
  @Get("cross-sell-rules")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "List cross-sell rules" })
  async getCrossSellRules(@Req() req: AuthReq, @Query("productId") productId?: string) {
    return this.cpqExtService.getCrossSellRules(req.user.tenantId, productId);
  }

  @Post("cross-sell-rules")
  @Permissions("sales.cpq.create")
  @ApiOperation({ summary: "Create cross-sell rule" })
  async createCrossSellRule(@Req() req: AuthReq, @ZodBody(createCrossSellRuleSchema) dto: CreateCrossSellRuleDto) {
    return this.cpqExtService.createCrossSellRule(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Delete("cross-sell-rules/:id")
  @Permissions("sales.cpq.delete")
  @ApiOperation({ summary: "Delete cross-sell rule" })
  async deleteCrossSellRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.cpqExtService.deleteCrossSellRule(req.user.tenantId, id);
  }

  @Get("upsell-rules")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "List upsell rules" })
  async getUpsellRules(@Req() req: AuthReq, @Query("productId") productId?: string) {
    return this.cpqExtService.getUpsellRules(req.user.tenantId, productId);
  }

  @Post("upsell-rules")
  @Permissions("sales.cpq.create")
  @ApiOperation({ summary: "Create upsell rule" })
  async createUpsellRule(@Req() req: AuthReq, @ZodBody(createUpsellRuleSchema) dto: CreateUpsellRuleDto) {
    return this.cpqExtService.createUpsellRule(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Delete("upsell-rules/:id")
  @Permissions("sales.cpq.delete")
  @ApiOperation({ summary: "Delete upsell rule" })
  async deleteUpsellRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.cpqExtService.deleteUpsellRule(req.user.tenantId, id);
  }

  // ── Guided Selling & Recommendations ──
  @Get("guided-selling/:productId")
  @Permissions("sales.cpq.read")
  @ApiOperation({ summary: "Guided selling recommendations" })
  async guidedSelling(@Req() req: AuthReq, @Param("productId") productId: string) {
    return this.cpqExtService.getGuidedSellingRecommendations(req.user.tenantId, productId);
  }
}
