import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SalesQuoteCpqMasterDeepService } from "./sales-quote-cpq-master-deep.service";

@ApiTags("Sales Quote CPQ Master")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/cpq-master")
export class SalesQuoteCpqMasterDeepController {
  constructor(
    private readonly cpqMasterService: SalesQuoteCpqMasterDeepService,
  ) {}

  // 1. Bundle Rules & Guided Selling
  @Post("bundle-rules")
  @ApiOperation({ summary: "Create bundle rule" })
  @Permissions("sales.cpq.admin")
  async createBundleRule(@CurrentUser() user: any, @Body() rule: any) {
    return this.cpqMasterService.createBundleRule(user.tenantId, rule);
  }

  @Get("bundle-rules")
  @ApiOperation({ summary: "Get bundle rules" })
  @Permissions("sales.cpq.read")
  async getBundleRules(@CurrentUser() user: any) {
    return this.cpqMasterService.getBundleRules(user.tenantId);
  }

  @Get("bundle-rules/:id")
  @ApiOperation({ summary: "Get bundle rule by ID" })
  @Permissions("sales.cpq.read")
  async getBundleRuleById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.cpqMasterService.getBundleRuleById(user.tenantId, id);
  }

  @Patch("bundle-rules/:id")
  @ApiOperation({ summary: "Update bundle rule" })
  @Permissions("sales.cpq.admin")
  async updateBundleRule(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() rule: any,
  ) {
    return this.cpqMasterService.updateBundleRule(user.tenantId, id, rule);
  }

  @Delete("bundle-rules/:id")
  @ApiOperation({ summary: "Delete bundle rule" })
  @Permissions("sales.cpq.admin")
  async deleteBundleRule(@CurrentUser() user: any, @Param("id") id: string) {
    return this.cpqMasterService.deleteBundleRule(user.tenantId, id);
  }

  @Post("guided-selling/questions")
  @ApiOperation({ summary: "Run guided selling questions" })
  @Permissions("sales.cpq.read")
  async runGuidedSellingQuestions(@CurrentUser() user: any, @Body() body: any) {
    return this.cpqMasterService.runGuidedSellingQuestions(
      user.tenantId,
      body?.answers,
    );
  }

  @Post("compatibility/evaluate")
  @ApiOperation({ summary: "Evaluate product compatibility" })
  @Permissions("sales.cpq.read")
  async evaluateProductCompatibility(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.cpqMasterService.evaluateProductCompatibility(
      user.tenantId,
      body?.productIdList || [],
    );
  }

  @Get("volume-tier-discounts")
  @ApiOperation({ summary: "Get dynamic volume tier discounts" })
  @Permissions("sales.cpq.read")
  async getDynamicVolumeTierDiscounts(
    @CurrentUser() user: any,
    @Query("productId") productId: string,
    @Query("quantity") quantity: number,
  ) {
    return this.cpqMasterService.getDynamicVolumeTierDiscounts(
      user.tenantId,
      productId,
      Number(quantity) || 1,
    );
  }

  @Post("validate-quote")
  @ApiOperation({ summary: "Run CPQ validation engine" })
  @Permissions("sales.cpq.read")
  async runCpqValidationEngine(
    @CurrentUser() user: any,
    @Body() quoteData: any,
  ) {
    return this.cpqMasterService.runCpqValidationEngine(
      user.tenantId,
      quoteData,
    );
  }

  @Post("quotes/:id/clone")
  @ApiOperation({ summary: "Clone CPQ quote" })
  @Permissions("sales.cpq.create")
  async cloneCpqQuote(@CurrentUser() user: any, @Param("id") id: string) {
    return this.cpqMasterService.cloneCpqQuote(user.tenantId, id);
  }

  @Get("quotes/:id/revisions")
  @ApiOperation({ summary: "Get CPQ quote revision history" })
  @Permissions("sales.cpq.read")
  async getCpqQuoteRevisionHistory(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.getCpqQuoteRevisionHistory(user.tenantId, id);
  }

  @Post("quotes/:id/revisions")
  @ApiOperation({ summary: "Create quote revision" })
  @Permissions("sales.cpq.update")
  async createQuoteRevision(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() revisionData: any,
  ) {
    return this.cpqMasterService.createQuoteRevision(
      user.tenantId,
      id,
      revisionData,
    );
  }

  @Get("margin-guardrails")
  @ApiOperation({ summary: "Get CPQ margin guardrails" })
  @Permissions("sales.cpq.read")
  async getCpqMarginGuardrails(@CurrentUser() user: any) {
    return this.cpqMasterService.getCpqMarginGuardrails(user.tenantId);
  }

  @Post("margin-guardrails")
  @ApiOperation({ summary: "Update CPQ margin guardrails" })
  @Permissions("sales.cpq.admin")
  async updateCpqMarginGuardrails(
    @CurrentUser() user: any,
    @Body() guardrails: any,
  ) {
    return this.cpqMasterService.updateCpqMarginGuardrails(
      user.tenantId,
      guardrails,
    );
  }

  @Post("quotes/:id/ramp-schedule")
  @ApiOperation({ summary: "Set ramp deal schedule" })
  @Permissions("sales.cpq.update")
  async setRampDealSchedule(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.cpqMasterService.setRampDealSchedule(
      user.tenantId,
      id,
      body?.rampPeriods || [],
    );
  }

  @Get("quotes/:id/ramp-schedule")
  @ApiOperation({ summary: "Get ramp deal schedule" })
  @Permissions("sales.cpq.read")
  async getRampDealSchedule(@CurrentUser() user: any, @Param("id") id: string) {
    return this.cpqMasterService.getRampDealSchedule(user.tenantId, id);
  }

  @Get("quotes/:id/milestone-billing")
  @ApiOperation({ summary: "Calculate milestone billing schedule" })
  @Permissions("sales.cpq.read")
  async calculateMilestoneBillingSchedule(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.calculateMilestoneBillingSchedule(
      user.tenantId,
      id,
    );
  }

  @Post("quotes/:id/generate-pdf")
  @ApiOperation({ summary: "Generate proposal PDF document" })
  @Permissions("sales.cpq.read")
  async generateProposalPdfDocument(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.cpqMasterService.generateProposalPdfDocument(
      user.tenantId,
      id,
      body?.templateId,
    );
  }

  @Post("quotes/:id/send-esign")
  @ApiOperation({ summary: "Send proposal for e-signature" })
  @Permissions("sales.cpq.update")
  async sendProposalForEsignature(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.cpqMasterService.sendProposalForEsignature(
      user.tenantId,
      id,
      body?.signers || [],
    );
  }

  @Get("quotes/:id/esign-status")
  @ApiOperation({ summary: "Get e-signature status" })
  @Permissions("sales.cpq.read")
  async getEsignatureStatus(@CurrentUser() user: any, @Param("id") id: string) {
    return this.cpqMasterService.getEsignatureStatus(user.tenantId, id);
  }

  // 2. Custom Price Agreements & Conversions
  @Post("price-agreements")
  @ApiOperation({ summary: "Create custom price agreement" })
  @Permissions("sales.agreement.create")
  async createCustomPriceAgreement(
    @CurrentUser() user: any,
    @Body() agreement: any,
  ) {
    return this.cpqMasterService.createCustomPriceAgreement(
      user.tenantId,
      agreement,
    );
  }

  @Get("price-agreements")
  @ApiOperation({ summary: "Get custom price agreements" })
  @Permissions("sales.agreement.read")
  async getCustomPriceAgreements(
    @CurrentUser() user: any,
    @Query("customerId") customerId?: string,
  ) {
    return this.cpqMasterService.getCustomPriceAgreements(
      user.tenantId,
      customerId,
    );
  }

  @Get("price-agreements/:id")
  @ApiOperation({ summary: "Get custom price agreement by ID" })
  @Permissions("sales.agreement.read")
  async getCustomPriceAgreementById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.getCustomPriceAgreementById(user.tenantId, id);
  }

  @Patch("price-agreements/:id")
  @ApiOperation({ summary: "Update custom price agreement" })
  @Permissions("sales.agreement.update")
  async updateCustomPriceAgreement(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() agreement: any,
  ) {
    return this.cpqMasterService.updateCustomPriceAgreement(
      user.tenantId,
      id,
      agreement,
    );
  }

  @Delete("price-agreements/:id")
  @ApiOperation({ summary: "Delete custom price agreement" })
  @Permissions("sales.agreement.delete")
  async deleteCustomPriceAgreement(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.deleteCustomPriceAgreement(user.tenantId, id);
  }

  @Post("quotes/:id/convert-to-sales-order")
  @ApiOperation({ summary: "Convert quote to sales order" })
  @Permissions("sales.quote.convert")
  async convertQuoteToSalesOrder(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.convertQuoteToSalesOrder(user.tenantId, id);
  }

  @Post("quotes/:id/convert-to-contract")
  @ApiOperation({ summary: "Convert quote to contract" })
  @Permissions("sales.quote.convert")
  async convertQuoteToContract(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.convertQuoteToContract(user.tenantId, id);
  }

  @Get("quotes/:id/revenue-recognition-preview")
  @ApiOperation({ summary: "Preview revenue recognition schedule" })
  @Permissions("sales.cpq.read")
  async previewRevenueRecognitionSchedule(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.previewRevenueRecognitionSchedule(
      user.tenantId,
      id,
    );
  }

  @Post("quotes/:id/partner-coselling-margin")
  @ApiOperation({ summary: "Calculate partner co-selling margin" })
  @Permissions("sales.cpq.read")
  async calculatePartnerCoSellingMargin(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.cpqMasterService.calculatePartnerCoSellingMargin(
      user.tenantId,
      id,
      body?.partnerId,
    );
  }

  @Get("terms-and-conditions")
  @ApiOperation({ summary: "Get terms and conditions templates" })
  @Permissions("sales.terms.read")
  async getTermsAndConditionsTemplates(@CurrentUser() user: any) {
    return this.cpqMasterService.getTermsAndConditionsTemplates(user.tenantId);
  }

  @Post("terms-and-conditions")
  @ApiOperation({ summary: "Create terms and conditions template" })
  @Permissions("sales.terms.admin")
  async createTermsAndConditionsTemplate(
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.cpqMasterService.createTermsAndConditionsTemplate(
      user.tenantId,
      data,
    );
  }

  @Patch("terms-and-conditions/:id")
  @ApiOperation({ summary: "Update terms and conditions template" })
  @Permissions("sales.terms.admin")
  async updateTermsAndConditionsTemplate(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.cpqMasterService.updateTermsAndConditionsTemplate(
      user.tenantId,
      id,
      data,
    );
  }

  @Delete("terms-and-conditions/:id")
  @ApiOperation({ summary: "Delete terms and conditions template" })
  @Permissions("sales.terms.admin")
  async deleteTermsAndConditionsTemplate(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.deleteTermsAndConditionsTemplate(
      user.tenantId,
      id,
    );
  }

  @Post("quotes/:id/auto-renewal-rules")
  @ApiOperation({ summary: "Set quote auto renewal rules" })
  @Permissions("sales.cpq.update")
  async setQuoteAutoRenewalRules(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() rules: any,
  ) {
    return this.cpqMasterService.setQuoteAutoRenewalRules(
      user.tenantId,
      id,
      rules,
    );
  }

  @Get("quotes/:id/auto-renewal-rules")
  @ApiOperation({ summary: "Get quote auto renewal rules" })
  @Permissions("sales.cpq.read")
  async getQuoteAutoRenewalRules(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.cpqMasterService.getQuoteAutoRenewalRules(user.tenantId, id);
  }

  @Post("quotes/run-expiry-check")
  @ApiOperation({ summary: "Run quote expiry check" })
  @Permissions("sales.cpq.admin")
  async runQuoteExpiryCheck(@CurrentUser() user: any) {
    return this.cpqMasterService.runQuoteExpiryCheck(user.tenantId);
  }

  @Post("quotes/:id/extend-expiry")
  @ApiOperation({ summary: "Extend quote expiry date" })
  @Permissions("sales.cpq.update")
  async extendQuoteExpiryDate(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.cpqMasterService.extendQuoteExpiryDate(
      user.tenantId,
      id,
      body?.newExpiryDate,
    );
  }

  @Get("analytics/overview")
  @ApiOperation({ summary: "Get CPQ analytics overview" })
  @Permissions("sales.cpq.read")
  async getCpqAnalyticsOverview(
    @CurrentUser() user: any,
    @Query("timeframe") timeframe: string,
  ) {
    return this.cpqMasterService.getCpqAnalyticsOverview(
      user.tenantId,
      timeframe,
    );
  }

  @Get("export")
  @ApiOperation({ summary: "Export CPQ data" })
  @Permissions("sales.cpq.read")
  async exportCpqData(
    @CurrentUser() user: any,
    @Query("format") format: string,
  ) {
    return this.cpqMasterService.exportCpqData(user.tenantId, format);
  }

  @Get("configuration")
  @ApiOperation({ summary: "Get CPQ system configuration" })
  @Permissions("sales.cpq.read")
  async getCpqSystemConfiguration(@CurrentUser() user: any) {
    return this.cpqMasterService.getCpqSystemConfiguration(user.tenantId);
  }
}
