import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CrmService } from './crm.service';
import {
  CreateCustomerInput, UpdateCustomerInput,
  CreateVendorInput,
  CreateContactInput, UpdateContactInput,
  CreateLeadInput, UpdateLeadInput,
  CreateOpportunityInput, UpdateOpportunityInput,
  CreateActivityInput,
  CreateEmailTemplateInput, UpdateEmailTemplateInput,
  CreateSalesPipelineInput,
  CreateCampaignInput,
  CreateOpportunityLineItemInput, UpdateOpportunityLineItemInput,
  CreatePriceBookInput, UpdatePriceBookInput, CreatePriceBookEntryInput,
  CreateContactTagInput, MergeContactsInput,
  CreateSalesTargetInput, UpdateSalesTargetInput,
  CreateSavedReportInput,
  CreateCrmWorkflowRuleInput, UpdateCrmWorkflowRuleInput,
  CreateEmailSequenceInput, EnrollSequenceInput,
  CreateSalesTerritoryInput, UpdateSalesTerritoryInput, AddTeamMemberInput,
  CreateCommissionRuleInput, UpdateCommissionRuleInput, CalculateCommissionsInput,
  CreateWebToLeadFormInput, UpdateWebToLeadFormInput, SubmitWebFormInput,
  CreateCrmDocumentInput,
  CreateCustomFieldInput, UpdateCustomFieldInput, CreateRecordTypeInput, UpdateRecordTypeInput,
  CreateApprovalProcessInput, UpdateApprovalProcessInput,
  CreateQuotationTemplateInput, UpdateQuotationTemplateInput,
  CreateCrmCommentInput, CreateCrmNoteInput, UpdateCrmNoteInput,
  CreatePlaybookInput, UpdatePlaybookInput, CreateBattlecardInput, UpdateBattlecardInput,
  CreateCrmDashboardInput, UpdateCrmDashboardInput, CreateDashboardWidgetInput, UpdateDashboardWidgetInput,
} from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) { }

  // ── CUSTOMERS ─────────────────────────────────

  @Get('customers')
  @Permissions('crm.contact.read')
  async getCustomers(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCustomers(req.user.tenantId);
  }

  @Get('customers/:id')
  @Permissions('crm.contact.read')
  async getCustomerById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getCustomerById(req.user.tenantId, id);
  }

  @Post('customers')
  @Permissions('crm.contact.create')
  async createCustomer(@Req() req: AuthenticatedRequest, @Body() dto: CreateCustomerInput) {
    return this.crmService.createCustomer(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('customers/:id')
  @Permissions('crm.contact.update')
  async updateCustomer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCustomerInput) {
    return this.crmService.updateCustomer(req.user.tenantId, id, dto);
  }

  @Delete('customers/:id')
  @Permissions('crm.contact.delete')
  async deleteCustomer(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCustomer(req.user.tenantId, id);
  }

  // ── VENDORS ────────────────────────────────────

  @Get('vendors')
  @Permissions('procurement.vendor.read')
  async getVendors(@Req() req: AuthenticatedRequest) {
    return this.crmService.getVendors(req.user.tenantId);
  }

  @Post('vendors')
  @Permissions('procurement.vendor.create')
  async createVendor(@Req() req: AuthenticatedRequest, @Body() dto: CreateVendorInput) {
    return this.crmService.createVendor(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  // ── CONTACTS ──────────────────────────────────

  @Get('contacts')
  @Permissions('crm.contact.read')
  async getContacts(@Req() req: AuthenticatedRequest, @Query('customerId') customerId?: string) {
    return this.crmService.getContacts(req.user.tenantId, customerId);
  }

  @Post('contacts')
  @Permissions('crm.contact.create')
  async createContact(@Req() req: AuthenticatedRequest, @Body() dto: CreateContactInput) {
    return this.crmService.createContact(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('contacts/:id')
  @Permissions('crm.contact.update')
  async updateContact(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateContactInput) {
    return this.crmService.updateContact(req.user.tenantId, id, dto);
  }

  @Delete('contacts/:id')
  @Permissions('crm.contact.delete')
  async deleteContact(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteContact(req.user.tenantId, id);
  }

  // ── LEAD SOURCES ──────────────────────────────

  @Get('lead-sources')
  @Permissions('crm.lead.read')
  async getLeadSources(@Req() req: AuthenticatedRequest) {
    return this.crmService.getLeadSources(req.user.tenantId);
  }

  // ── LEADS ─────────────────────────────────────

  @Get('leads')
  @Permissions('crm.lead.read')
  async getLeads(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.crmService.getLeads(req.user.tenantId, status);
  }

  @Get('leads/:id')
  @Permissions('crm.lead.read')
  async getLeadById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getLeadById(req.user.tenantId, id);
  }

  @Post('leads')
  @Permissions('crm.lead.create')
  async createLead(@Req() req: AuthenticatedRequest, @Body() dto: CreateLeadInput) {
    return this.crmService.createLead(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('leads/:id')
  @Permissions('crm.lead.update')
  async updateLead(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateLeadInput) {
    return this.crmService.updateLead(req.user.tenantId, id, dto);
  }

  @Patch('leads/:id/status')
  @Permissions('crm.lead.update')
  async updateLeadStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { status: string }) {
    return this.crmService.updateLeadStatus(req.user.tenantId, id, body.status);
  }

  @Post('leads/:id/convert')
  @Permissions('crm.lead.create')
  async convertLead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { customerName?: string; opportunityName?: string; opportunityAmount?: number }
  ) {
    return this.crmService.convertLead(
      req.user.tenantId,
      req.user.orgId || 'org-system-default',
      id,
      body.customerName,
      body.opportunityName,
      body.opportunityAmount
    );
  }

  @Delete('leads/:id')
  @Permissions('crm.lead.delete')
  async deleteLead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteLead(req.user.tenantId, id);
  }

  // ── SALES PIPELINES ───────────────────────────

  @Get('pipelines')
  @Permissions('crm.opportunity.read')
  async getPipelines(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPipelines(req.user.tenantId);
  }

  @Post('pipelines')
  @Permissions('crm.opportunity.create')
  async createPipeline(@Req() req: AuthenticatedRequest, @Body() dto: CreateSalesPipelineInput) {
    return this.crmService.createPipeline(req.user.tenantId, dto);
  }

  // ── OPPORTUNITIES ─────────────────────────────

  @Get('opportunities')
  @Permissions('crm.opportunity.read')
  async getOpportunities(
    @Req() req: AuthenticatedRequest,
    @Query('pipelineId') pipelineId?: string,
    @Query('stage') stage?: string
  ) {
    return this.crmService.getOpportunities(req.user.tenantId, pipelineId, stage);
  }

  @Get('opportunities/:id')
  @Permissions('crm.opportunity.read')
  async getOpportunityById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getOpportunityById(req.user.tenantId, id);
  }

  @Post('opportunities')
  @Permissions('crm.opportunity.create')
  async createOpportunity(@Req() req: AuthenticatedRequest, @Body() dto: CreateOpportunityInput) {
    return this.crmService.createOpportunity(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('opportunities/:id')
  @Permissions('crm.opportunity.update')
  async updateOpportunity(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateOpportunityInput) {
    return this.crmService.updateOpportunity(req.user.tenantId, id, dto);
  }

  @Patch('opportunities/:id/stage')
  @Permissions('crm.opportunity.update')
  async updateOpportunityStage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { stage: string; probability?: number; actualCloseDate?: string; lossReason?: string }
  ) {
    return this.crmService.updateOpportunityStage(req.user.tenantId, id, body.stage, body.probability, body.actualCloseDate, body.lossReason);
  }

  @Delete('opportunities/:id')
  @Permissions('crm.opportunity.delete')
  async deleteOpportunity(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteOpportunity(req.user.tenantId, id);
  }

  // ── ACTIVITIES ────────────────────────────────

  @Get('activities')
  @Permissions('crm.activity.read')
  async getActivities(
    @Req() req: AuthenticatedRequest,
    @Query('leadId') leadId?: string,
    @Query('opportunityId') opportunityId?: string,
    @Query('customerId') customerId?: string
  ) {
    return this.crmService.getActivities(req.user.tenantId, leadId, opportunityId, customerId);
  }

  @Post('activities')
  @Permissions('crm.activity.create')
  async createActivity(@Req() req: AuthenticatedRequest, @Body() dto: CreateActivityInput) {
    return this.crmService.createActivity(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Patch('activities/:id/complete')
  @Permissions('crm.activity.update')
  async completeActivity(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.completeActivity(req.user.tenantId, id);
  }

  // ── EMAIL TEMPLATES ───────────────────────────

  @Get('email-templates')
  @Permissions('crm.settings.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.crmService.getEmailTemplates(req.user.tenantId);
  }

  @Post('email-templates')
  @Permissions('crm.settings.create')
  async createEmailTemplate(@Req() req: AuthenticatedRequest, @Body() dto: CreateEmailTemplateInput) {
    return this.crmService.createEmailTemplate(req.user.tenantId, dto);
  }

  @Put('email-templates/:id')
  @Permissions('crm.settings.update')
  async updateEmailTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateEmailTemplateInput) {
    return this.crmService.updateEmailTemplate(req.user.tenantId, id, dto);
  }

  @Delete('email-templates/:id')
  @Permissions('crm.settings.delete')
  async deleteEmailTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteEmailTemplate(req.user.tenantId, id);
  }

  // ── ANALYTICS ─────────────────────────────────

  @Get('analytics/pipeline-funnel')
  @Permissions('crm.report.read')
  async getPipelineFunnel(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPipelineFunnel(req.user.tenantId);
  }

  @Get('analytics/win-rate')
  @Permissions('crm.report.read')
  async getWinRate(@Req() req: AuthenticatedRequest) {
    return this.crmService.getWinRate(req.user.tenantId);
  }

  @Get('analytics/lead-source-breakdown')
  @Permissions('crm.report.read')
  async getLeadSourceBreakdown(@Req() req: AuthenticatedRequest) {
    return this.crmService.getLeadSourceBreakdown(req.user.tenantId);
  }

  // ── CAMPAIGNS ─────────────────────────────────

  @Get('campaigns')
  @Permissions('crm.lead.read')
  async getCampaigns(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCampaigns(req.user.tenantId);
  }

  @Post('campaigns')
  @Permissions('crm.lead.create')
  async createCampaign(@Req() req: AuthenticatedRequest, @Body() dto: CreateCampaignInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.crmService.createCampaign(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  // ── PHASE 1: OPPORTUNITY LINE ITEMS ───────────

  @Get('opportunities/:id/line-items')
  @Permissions('crm.opportunity.read')
  async getOpportunityLineItems(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getOpportunityLineItems(req.user.tenantId, id);
  }

  @Post('opportunities/:id/line-items')
  @Permissions('crm.opportunity.update')
  async addOpportunityLineItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateOpportunityLineItemInput) {
    return this.crmService.addOpportunityLineItem(req.user.tenantId, id, dto);
  }

  @Put('opportunities/:id/line-items/:itemId')
  @Permissions('crm.opportunity.update')
  async updateOpportunityLineItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateOpportunityLineItemInput) {
    return this.crmService.updateOpportunityLineItem(req.user.tenantId, id, itemId, dto);
  }

  @Delete('opportunities/:id/line-items/:itemId')
  @Permissions('crm.opportunity.update')
  async deleteOpportunityLineItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.crmService.deleteOpportunityLineItem(req.user.tenantId, id, itemId);
  }

  // ── PHASE 1: PRICE BOOKS ─────────────────────

  @Get('products')
  @Permissions('crm.product.read')
  async getCrmProducts(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCrmProducts(req.user.tenantId);
  }

  @Get('price-books')
  @Permissions('crm.product.read')
  async getPriceBooks(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPriceBooks(req.user.tenantId);
  }

  @Post('price-books')
  @Permissions('crm.product.create')
  async createPriceBook(@Req() req: AuthenticatedRequest, @Body() dto: CreatePriceBookInput) {
    return this.crmService.createPriceBook(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('price-books/:id')
  @Permissions('crm.product.update')
  async updatePriceBook(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePriceBookInput) {
    return this.crmService.updatePriceBook(req.user.tenantId, id, dto);
  }

  @Delete('price-books/:id')
  @Permissions('crm.product.delete')
  async deletePriceBook(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deletePriceBook(req.user.tenantId, id);
  }

  @Get('price-books/:id/entries')
  @Permissions('crm.product.read')
  async getPriceBookEntries(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getPriceBookEntries(req.user.tenantId, id);
  }

  @Post('price-books/:id/entries')
  @Permissions('crm.product.create')
  async addPriceBookEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreatePriceBookEntryInput) {
    return this.crmService.addPriceBookEntry(req.user.tenantId, id, dto);
  }

  @Delete('price-book-entries/:id')
  @Permissions('crm.product.delete')
  async deletePriceBookEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deletePriceBookEntry(req.user.tenantId, id);
  }

  // ── PHASE 1: REVENUE ANALYTICS ───────────────

  @Get('analytics/revenue-forecast')
  @Permissions('crm.report.read')
  async getRevenueForecast(@Req() req: AuthenticatedRequest) {
    return this.crmService.getRevenueForecast(req.user.tenantId);
  }

  @Get('analytics/deal-aging')
  @Permissions('crm.report.read')
  async getDealAging(@Req() req: AuthenticatedRequest) {
    return this.crmService.getDealAging(req.user.tenantId);
  }

  // ── PHASE 2: CONTACT TAGS & 360 ──────────────

  @Get('contacts/tags')
  @Permissions('crm.contact.read')
  async getContactTags(@Req() req: AuthenticatedRequest) {
    return this.crmService.getContactTags(req.user.tenantId);
  }

  @Post('contacts/tags')
  @Permissions('crm.contact.create')
  async createContactTag(@Req() req: AuthenticatedRequest, @Body() dto: CreateContactTagInput) {
    return this.crmService.createContactTag(req.user.tenantId, dto);
  }

  @Delete('contacts/tags/:id')
  @Permissions('crm.contact.delete')
  async deleteContactTag(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteContactTag(req.user.tenantId, id);
  }

  @Post('contacts/:id/tags')
  @Permissions('crm.contact.update')
  async assignContactTag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { tagId: string }) {
    return this.crmService.assignContactTag(req.user.tenantId, id, body.tagId);
  }

  @Delete('contacts/:id/tags/:tagId')
  @Permissions('crm.contact.update')
  async removeContactTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.crmService.removeContactTag(id, tagId);
  }

  @Get('contacts/:id/timeline')
  @Permissions('crm.contact.read')
  async getContactTimeline(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getContactTimeline(req.user.tenantId, id);
  }

  @Get('contacts/duplicates')
  @Permissions('crm.contact.read')
  async findDuplicateContacts(@Req() req: AuthenticatedRequest) {
    return this.crmService.findDuplicateContacts(req.user.tenantId);
  }

  @Post('contacts/merge')
  @Permissions('crm.contact.update')
  async mergeContacts(@Req() req: AuthenticatedRequest, @Body() dto: MergeContactsInput) {
    return this.crmService.mergeContacts(req.user.tenantId, dto);
  }

  // ── PHASE 2: PIPELINE HEALTH ─────────────────

  @Get('analytics/stage-duration')
  @Permissions('crm.report.read')
  async getStageDuration(@Req() req: AuthenticatedRequest) {
    return this.crmService.getStageDuration(req.user.tenantId);
  }

  @Get('analytics/pipeline-health')
  @Permissions('crm.report.read')
  async getPipelineHealth(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPipelineHealth(req.user.tenantId);
  }

  // ── PHASE 3: SALES TARGETS ───────────────────

  @Get('targets')
  @Permissions('crm.settings.read')
  async getSalesTargets(@Req() req: AuthenticatedRequest) {
    return this.crmService.getSalesTargets(req.user.tenantId);
  }

  @Post('targets')
  @Permissions('crm.settings.create')
  async createSalesTarget(@Req() req: AuthenticatedRequest, @Body() dto: CreateSalesTargetInput) {
    return this.crmService.createSalesTarget(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('targets/:id')
  @Permissions('crm.settings.update')
  async updateSalesTarget(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateSalesTargetInput) {
    return this.crmService.updateSalesTarget(req.user.tenantId, id, dto);
  }

  @Delete('targets/:id')
  @Permissions('crm.settings.delete')
  async deleteSalesTarget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteSalesTarget(req.user.tenantId, id);
  }

  // ── PHASE 3: FORECASTING & ANALYTICS ─────────

  @Get('analytics/forecast')
  @Permissions('crm.report.read')
  async getForecast(@Req() req: AuthenticatedRequest) {
    return this.crmService.getForecast(req.user.tenantId);
  }

  @Get('analytics/rep-performance')
  @Permissions('crm.report.read')
  async getRepPerformance(@Req() req: AuthenticatedRequest) {
    return this.crmService.getRepPerformance(req.user.tenantId);
  }

  @Get('analytics/conversion-funnel')
  @Permissions('crm.report.read')
  async getConversionFunnel(@Req() req: AuthenticatedRequest) {
    return this.crmService.getConversionFunnel(req.user.tenantId);
  }

  @Get('analytics/cohort')
  @Permissions('crm.report.read')
  async getCohortAnalysis(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCohortAnalysis(req.user.tenantId);
  }

  // ── PHASE 3: SAVED REPORTS ───────────────────

  @Get('reports/saved')
  @Permissions('crm.report.read')
  async getSavedReports(@Req() req: AuthenticatedRequest) {
    return this.crmService.getSavedReports(req.user.tenantId);
  }

  @Post('reports/saved')
  @Permissions('crm.report.create')
  async createSavedReport(@Req() req: AuthenticatedRequest, @Body() dto: CreateSavedReportInput) {
    return this.crmService.createSavedReport(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Get('reports/saved/:id/run')
  @Permissions('crm.report.read')
  async runSavedReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.runSavedReport(req.user.tenantId, id);
  }

  @Delete('reports/saved/:id')
  @Permissions('crm.report.delete')
  async deleteSavedReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteSavedReport(req.user.tenantId, id);
  }

  // ── PHASE 4: WORKFLOW RULES ──────────────────

  @Get('workflows')
  @Permissions('crm.settings.read')
  async getWorkflowRules(@Req() req: AuthenticatedRequest) {
    return this.crmService.getWorkflowRules(req.user.tenantId);
  }

  @Post('workflows')
  @Permissions('crm.settings.create')
  async createWorkflowRule(@Req() req: AuthenticatedRequest, @Body() dto: CreateCrmWorkflowRuleInput) {
    return this.crmService.createWorkflowRule(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @Put('workflows/:id')
  @Permissions('crm.settings.update')
  async updateWorkflowRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCrmWorkflowRuleInput) {
    return this.crmService.updateWorkflowRule(req.user.tenantId, id, dto);
  }

  @Patch('workflows/:id/toggle')
  @Permissions('crm.settings.update')
  async toggleWorkflowRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.toggleWorkflowRule(req.user.tenantId, id);
  }

  @Delete('workflows/:id')
  @Permissions('crm.settings.delete')
  async deleteWorkflowRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteWorkflowRule(req.user.tenantId, id);
  }

  // ── PHASE 4: EMAIL SEQUENCES ─────────────────

  @Get('sequences')
  @Permissions('crm.settings.read')
  async getEmailSequences(@Req() req: AuthenticatedRequest) {
    return this.crmService.getEmailSequences(req.user.tenantId);
  }

  @Post('sequences')
  @Permissions('crm.settings.create')
  async createEmailSequence(@Req() req: AuthenticatedRequest, @Body() dto: CreateEmailSequenceInput) {
    return this.crmService.createEmailSequence(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @Post('sequences/:id/enroll')
  @Permissions('crm.settings.create')
  async enrollInSequence(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: EnrollSequenceInput) {
    return this.crmService.enrollInSequence(req.user.tenantId, id, dto);
  }

  @Patch('sequences/enrollments/:id/pause')
  @Permissions('crm.settings.update')
  async pauseEnrollment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.pauseEnrollment(req.user.tenantId, id);
  }

  @Delete('sequences/:id')
  @Permissions('crm.settings.delete')
  async deleteEmailSequence(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteEmailSequence(req.user.tenantId, id);
  }

  // ── PHASE 5: TERRITORIES ─────────────────────

  @Get('territories')
  @Permissions('crm.settings.read')
  async getTerritories(@Req() req: AuthenticatedRequest) {
    return this.crmService.getTerritories(req.user.tenantId);
  }

  @Post('territories')
  @Permissions('crm.settings.create')
  async createTerritory(@Req() req: AuthenticatedRequest, @Body() dto: CreateSalesTerritoryInput) {
    return this.crmService.createTerritory(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('territories/:id')
  @Permissions('crm.settings.update')
  async updateTerritory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateSalesTerritoryInput) {
    return this.crmService.updateTerritory(req.user.tenantId, id, dto);
  }

  @Delete('territories/:id')
  @Permissions('crm.settings.delete')
  async deleteTerritory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteTerritory(req.user.tenantId, id);
  }

  @Post('territories/:id/members')
  @Permissions('crm.settings.create')
  async addTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: AddTeamMemberInput) {
    return this.crmService.addTeamMember(req.user.tenantId, id, dto);
  }

  @Delete('territories/:id/members/:userId')
  @Permissions('crm.settings.delete')
  async removeTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.crmService.removeTeamMember(req.user.tenantId, id, userId);
  }

  @Get('analytics/territory-performance')
  @Permissions('crm.report.read')
  async getTerritoryPerformance(@Req() req: AuthenticatedRequest) {
    return this.crmService.getTerritoryPerformance(req.user.tenantId);
  }

  // ── PHASE 5: COMMISSIONS ─────────────────────

  @Get('commissions/rules')
  @Permissions('crm.settings.read')
  async getCommissionRules(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCommissionRules(req.user.tenantId);
  }

  @Post('commissions/rules')
  @Permissions('crm.settings.create')
  async createCommissionRule(@Req() req: AuthenticatedRequest, @Body() dto: CreateCommissionRuleInput) {
    return this.crmService.createCommissionRule(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('commissions/rules/:id')
  @Permissions('crm.settings.update')
  async updateCommissionRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCommissionRuleInput) {
    return this.crmService.updateCommissionRule(req.user.tenantId, id, dto);
  }

  @Delete('commissions/rules/:id')
  @Permissions('crm.settings.delete')
  async deleteCommissionRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCommissionRule(req.user.tenantId, id);
  }

  @Get('commissions/entries')
  @Permissions('crm.report.read')
  async getCommissionEntries(@Req() req: AuthenticatedRequest, @Query('userId') userId?: string) {
    return this.crmService.getCommissionEntries(req.user.tenantId, userId);
  }

  @Post('commissions/calculate')
  @Permissions('crm.settings.create')
  async calculateCommissions(@Req() req: AuthenticatedRequest, @Body() dto: CalculateCommissionsInput) {
    return this.crmService.calculateCommissions(req.user.tenantId, dto);
  }

  // ── PHASE 6: WEB FORMS ───────────────────────

  @Get('forms')
  @Permissions('crm.settings.read')
  async getWebForms(@Req() req: AuthenticatedRequest) {
    return this.crmService.getWebForms(req.user.tenantId);
  }

  @Post('forms')
  @Permissions('crm.settings.create')
  async createWebForm(@Req() req: AuthenticatedRequest, @Body() dto: CreateWebToLeadFormInput) {
    return this.crmService.createWebForm(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('forms/:id')
  @Permissions('crm.settings.update')
  async updateWebForm(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateWebToLeadFormInput) {
    return this.crmService.updateWebForm(req.user.tenantId, id, dto);
  }

  @Delete('forms/:id')
  @Permissions('crm.settings.delete')
  async deleteWebForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteWebForm(req.user.tenantId, id);
  }

  @Post('forms/:id/submit')
  async submitWebForm(@Param('id') id: string, @Body() dto: SubmitWebFormInput) {
    return this.crmService.submitWebForm(id, dto);
  }

  @Get('forms/:id/embed')
  @Permissions('crm.settings.read')
  async getWebFormEmbed(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getWebFormEmbed(req.user.tenantId, id);
  }

  // ── PHASE 6: DOCUMENTS ───────────────────────

  @Get('documents')
  @Permissions('crm.contact.read')
  async getCrmDocuments(@Req() req: AuthenticatedRequest, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.crmService.getCrmDocuments(req.user.tenantId, entityType, entityId);
  }

  @Post('documents')
  @Permissions('crm.contact.create')
  async createCrmDocument(@Req() req: AuthenticatedRequest, @Body() dto: CreateCrmDocumentInput) {
    return this.crmService.createCrmDocument(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @Delete('documents/:id')
  @Permissions('crm.contact.delete')
  async deleteCrmDocument(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCrmDocument(req.user.tenantId, id);
  }

  // ── PHASE 6: IMPORT/EXPORT ───────────────────

  @Post('contacts/import')
  @Permissions('crm.contact.create')
  async importContacts(@Req() req: AuthenticatedRequest, @Body() body: { rows: Array<Record<string, string>> }) {
    return this.crmService.importContacts(req.user.tenantId, req.user.orgId || 'org-system-default', body.rows);
  }

  @Get('contacts/export')
  @Permissions('crm.contact.read')
  async exportContacts(@Req() req: AuthenticatedRequest) {
    return this.crmService.exportContacts(req.user.tenantId);
  }

  @Post('leads/import')
  @Permissions('crm.lead.create')
  async importLeads(@Req() req: AuthenticatedRequest, @Body() body: { rows: Array<Record<string, string>> }) {
    return this.crmService.importLeads(req.user.tenantId, req.user.orgId || 'org-system-default', body.rows);
  }

  @Get('leads/export')
  @Permissions('crm.lead.read')
  async exportLeads(@Req() req: AuthenticatedRequest) {
    return this.crmService.exportLeads(req.user.tenantId);
  }

  // ── PHASE 7: CUSTOM FIELDS ──────────────────

  @Get('custom-fields')
  @Permissions('crm.settings.read')
  async getCustomFields(@Req() req: AuthenticatedRequest, @Query('entity') entity?: string) {
    return this.crmService.getCustomFields(req.user.tenantId, entity);
  }

  @Post('custom-fields')
  @Permissions('crm.settings.create')
  async createCustomField(@Req() req: AuthenticatedRequest, @Body() dto: CreateCustomFieldInput) {
    return this.crmService.createCustomField(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @Put('custom-fields/:id')
  @Permissions('crm.settings.update')
  async updateCustomField(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCustomFieldInput) {
    return this.crmService.updateCustomField(req.user.tenantId, id, dto);
  }

  @Delete('custom-fields/:id')
  @Permissions('crm.settings.delete')
  async deleteCustomField(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCustomField(req.user.tenantId, id);
  }

  @Get('custom-field-values/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getCustomFieldValues(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getCustomFieldValues(req.user.tenantId, entityType, entityId);
  }

  @Put('custom-field-values/:entityType/:entityId')
  @Permissions('crm.contact.update')
  async upsertCustomFieldValues(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string, @Body() body: { values: Array<{ fieldId: string; value: string | null }> }) {
    return this.crmService.upsertCustomFieldValues(req.user.tenantId, entityType, entityId, body.values);
  }

  @Get('record-types')
  @Permissions('crm.settings.read')
  async getRecordTypes(@Req() req: AuthenticatedRequest, @Query('entity') entity?: string) {
    return this.crmService.getRecordTypes(req.user.tenantId, entity);
  }

  @Post('record-types')
  @Permissions('crm.settings.create')
  async createRecordType(@Req() req: AuthenticatedRequest, @Body() dto: CreateRecordTypeInput) {
    return this.crmService.createRecordType(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('record-types/:id')
  @Permissions('crm.settings.update')
  async updateRecordType(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateRecordTypeInput) {
    return this.crmService.updateRecordType(req.user.tenantId, id, dto);
  }

  @Delete('record-types/:id')
  @Permissions('crm.settings.delete')
  async deleteRecordType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteRecordType(req.user.tenantId, id);
  }

  // ── PHASE 8: APPROVALS ──────────────────────

  @Get('approval-processes')
  @Permissions('crm.settings.read')
  async getApprovalProcesses(@Req() req: AuthenticatedRequest) {
    return this.crmService.getApprovalProcesses(req.user.tenantId);
  }

  @Post('approval-processes')
  @Permissions('crm.settings.create')
  async createApprovalProcess(@Req() req: AuthenticatedRequest, @Body() dto: CreateApprovalProcessInput) {
    return this.crmService.createApprovalProcess(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @Put('approval-processes/:id')
  @Permissions('crm.settings.update')
  async updateApprovalProcess(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateApprovalProcessInput) {
    return this.crmService.updateApprovalProcess(req.user.tenantId, id, dto);
  }

  @Delete('approval-processes/:id')
  @Permissions('crm.settings.delete')
  async deleteApprovalProcess(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteApprovalProcess(req.user.tenantId, id);
  }

  @Post('approval-requests')
  @Permissions('crm.contact.create')
  async submitForApproval(@Req() req: AuthenticatedRequest, @Body() body: { entityType: string; entityId: string; processId?: string }) {
    return this.crmService.submitForApproval(req.user.tenantId, req.user.userId, body.entityType, body.entityId, body.processId);
  }

  @Get('approval-requests/pending')
  @Permissions('crm.contact.read')
  async getPendingApprovals(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPendingApprovals(req.user.tenantId);
  }

  @Get('approval-requests/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getApprovalHistory(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getApprovalHistory(req.user.tenantId, entityType, entityId);
  }

  @Post('approval-requests/:id/approve')
  @Permissions('crm.contact.update')
  async approveRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { comments?: string }) {
    return this.crmService.approveRequest(req.user.tenantId, id, req.user.userId, body.comments);
  }

  @Post('approval-requests/:id/reject')
  @Permissions('crm.contact.update')
  async rejectRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { comments: string }) {
    return this.crmService.rejectRequest(req.user.tenantId, id, req.user.userId, body.comments);
  }

  @Post('approval-requests/:id/recall')
  @Permissions('crm.contact.update')
  async recallRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.recallRequest(req.user.tenantId, id, req.user.userId);
  }

  // ── PHASE 9: QUOTATION TEMPLATES & CPQ ──────

  @Get('quotation-templates')
  @Permissions('crm.settings.read')
  async getQuotationTemplates(@Req() req: AuthenticatedRequest) {
    return this.crmService.getQuotationTemplates(req.user.tenantId);
  }

  @Post('quotation-templates')
  @Permissions('crm.settings.create')
  async createQuotationTemplate(@Req() req: AuthenticatedRequest, @Body() dto: CreateQuotationTemplateInput) {
    return this.crmService.createQuotationTemplate(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Put('quotation-templates/:id')
  @Permissions('crm.settings.update')
  async updateQuotationTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateQuotationTemplateInput) {
    return this.crmService.updateQuotationTemplate(req.user.tenantId, id, dto);
  }

  @Delete('quotation-templates/:id')
  @Permissions('crm.settings.delete')
  async deleteQuotationTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteQuotationTemplate(req.user.tenantId, id);
  }

  @Post('quotations/:id/versions')
  @Permissions('crm.opportunity.update')
  async createQuotationVersion(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { changeNote?: string }) {
    return this.crmService.createQuotationVersion(req.user.tenantId, id, req.user.userId, body.changeNote);
  }

  @Get('quotations/:id/versions')
  @Permissions('crm.opportunity.read')
  async getQuotationVersions(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getQuotationVersions(req.user.tenantId, id);
  }

  @Post('quotations/:id/clone')
  @Permissions('crm.opportunity.create')
  async cloneQuotation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.cloneQuotation(req.user.tenantId, id, req.user.userId);
  }

  @Post('quotations/:id/send-for-signature')
  @Permissions('crm.opportunity.update')
  async sendForSignature(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { signerName: string; signerEmail: string }) {
    return this.crmService.sendForSignature(req.user.tenantId, id, body.signerName, body.signerEmail);
  }

  @Get('quotation-sign/:token')
  async getQuotationBySignToken(@Param('token') token: string) {
    return this.crmService.getQuotationBySignToken(token);
  }

  @Post('quotation-sign/:token')
  async submitSignature(@Param('token') token: string, @Body() body: { signatureData: string }, @Req() req: Request) {
    return this.crmService.submitSignature(token, body.signatureData, req.ip || 'unknown');
  }

  // ── PHASE 10: COMMENTS & COLLABORATION ──────

  @Get('comments/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getComments(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getComments(req.user.tenantId, entityType, entityId);
  }

  @Post('comments/:entityType/:entityId')
  @Permissions('crm.contact.create')
  async createComment(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string, @Body() dto: CreateCrmCommentInput) {
    return this.crmService.createComment(req.user.tenantId, req.user.userId, entityType, entityId, dto);
  }

  @Put('comments/:id')
  @Permissions('crm.contact.update')
  async updateComment(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { body: string }) {
    return this.crmService.updateComment(req.user.tenantId, id, req.user.userId, body.body);
  }

  @Delete('comments/:id')
  @Permissions('crm.contact.delete')
  async deleteComment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteComment(req.user.tenantId, id);
  }

  @Post('comments/:id/pin')
  @Permissions('crm.contact.update')
  async togglePinComment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.togglePinComment(req.user.tenantId, id);
  }

  @Get('followers/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getFollowers(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getFollowers(req.user.tenantId, entityType, entityId);
  }

  @Post('followers/:entityType/:entityId')
  @Permissions('crm.contact.create')
  async followRecord(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.followRecord(req.user.tenantId, req.user.userId, entityType, entityId);
  }

  @Delete('followers/:entityType/:entityId')
  @Permissions('crm.contact.delete')
  async unfollowRecord(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.unfollowRecord(req.user.tenantId, req.user.userId, entityType, entityId);
  }

  @Get('notes/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getNotes(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getNotes(req.user.tenantId, entityType, entityId);
  }

  @Post('notes/:entityType/:entityId')
  @Permissions('crm.contact.create')
  async createNote(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string, @Body() dto: CreateCrmNoteInput) {
    return this.crmService.createNote(req.user.tenantId, req.user.userId, entityType, entityId, dto);
  }

  @Put('notes/:id')
  @Permissions('crm.contact.update')
  async updateNote(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCrmNoteInput) {
    return this.crmService.updateNote(req.user.tenantId, id, dto);
  }

  @Delete('notes/:id')
  @Permissions('crm.contact.delete')
  async deleteNote(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteNote(req.user.tenantId, id);
  }

  @Post('notes/:id/pin')
  @Permissions('crm.contact.update')
  async togglePinNote(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.togglePinNote(req.user.tenantId, id);
  }

  @Get('activity-feed/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getUnifiedActivityFeed(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getUnifiedActivityFeed(req.user.tenantId, entityType, entityId);
  }

  // ── PHASE 11: PLAYBOOKS & BATTLECARDS ───────

  @Get('playbooks')
  @Permissions('crm.settings.read')
  async getPlaybooks(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPlaybooks(req.user.tenantId);
  }

  @Post('playbooks')
  @Permissions('crm.settings.create')
  async createPlaybook(@Req() req: AuthenticatedRequest, @Body() dto: CreatePlaybookInput) {
    return this.crmService.createPlaybook(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @Put('playbooks/:id')
  @Permissions('crm.settings.update')
  async updatePlaybook(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePlaybookInput) {
    return this.crmService.updatePlaybook(req.user.tenantId, id, dto);
  }

  @Delete('playbooks/:id')
  @Permissions('crm.settings.delete')
  async deletePlaybook(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deletePlaybook(req.user.tenantId, id);
  }

  @Get('playbooks/:id/stages')
  @Permissions('crm.settings.read')
  async getPlaybookStages(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getPlaybookStages(req.user.tenantId, id);
  }

  @Put('playbooks/:id/stages')
  @Permissions('crm.settings.update')
  async upsertPlaybookStages(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { stages: Array<{ stageName: string; guidanceNotes?: string; checklist?: unknown[]; requiredFields?: string[]; talkingPoints?: string[]; exitCriteria?: unknown[]; sortOrder?: number }> }) {
    return this.crmService.upsertPlaybookStages(req.user.tenantId, id, body.stages);
  }

  @Get('battlecards')
  @Permissions('crm.settings.read')
  async getBattlecards(@Req() req: AuthenticatedRequest) {
    return this.crmService.getBattlecards(req.user.tenantId);
  }

  @Post('battlecards')
  @Permissions('crm.settings.create')
  async createBattlecard(@Req() req: AuthenticatedRequest, @Body() dto: CreateBattlecardInput) {
    return this.crmService.createBattlecard(req.user.tenantId, dto, req.user.userId);
  }

  @Put('battlecards/:id')
  @Permissions('crm.settings.update')
  async updateBattlecard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateBattlecardInput) {
    return this.crmService.updateBattlecard(req.user.tenantId, id, dto);
  }

  @Delete('battlecards/:id')
  @Permissions('crm.settings.delete')
  async deleteBattlecard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteBattlecard(req.user.tenantId, id);
  }

  @Get('battlecards/by-competitor/:competitor')
  @Permissions('crm.settings.read')
  async getBattlecardByCompetitor(@Req() req: AuthenticatedRequest, @Param('competitor') competitor: string) {
    return this.crmService.getBattlecardByCompetitor(req.user.tenantId, competitor);
  }

  @Get('opportunities/:id/checklist')
  @Permissions('crm.opportunity.read')
  async getOpportunityChecklist(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getOpportunityChecklist(req.user.tenantId, id);
  }

  @Put('opportunities/:id/checklist/:itemId')
  @Permissions('crm.opportunity.update')
  async toggleChecklistItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.crmService.toggleChecklistItem(req.user.tenantId, id, itemId, req.user.userId);
  }

  @Post('opportunities/:id/validate-stage-advance')
  @Permissions('crm.opportunity.read')
  async validateStageAdvance(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { targetStage: string }) {
    return this.crmService.validateStageAdvance(req.user.tenantId, id, body.targetStage);
  }

  // ── PHASE 12: DASHBOARD BUILDER ─────────────

  @Get('dashboards')
  @Permissions('crm.report.read')
  async getDashboards(@Req() req: AuthenticatedRequest) {
    return this.crmService.getDashboards(req.user.tenantId, req.user.userId);
  }

  @Post('dashboards')
  @Permissions('crm.report.create')
  async createDashboard(@Req() req: AuthenticatedRequest, @Body() dto: CreateCrmDashboardInput) {
    return this.crmService.createDashboard(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @Put('dashboards/:id')
  @Permissions('crm.report.update')
  async updateDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCrmDashboardInput) {
    return this.crmService.updateDashboard(req.user.tenantId, id, dto);
  }

  @Delete('dashboards/:id')
  @Permissions('crm.report.delete')
  async deleteDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteDashboard(req.user.tenantId, id);
  }

  @Post('dashboards/:id/clone')
  @Permissions('crm.report.create')
  async cloneDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.cloneDashboard(req.user.tenantId, id, req.user.userId);
  }

  @Post('dashboards/:id/widgets')
  @Permissions('crm.report.create')
  async addWidget(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateDashboardWidgetInput) {
    return this.crmService.addWidget(req.user.tenantId, id, dto);
  }

  @Put('dashboards/:id/widgets/:widgetId')
  @Permissions('crm.report.update')
  async updateWidget(@Req() req: AuthenticatedRequest, @Param('widgetId') widgetId: string, @Body() dto: UpdateDashboardWidgetInput) {
    return this.crmService.updateWidget(req.user.tenantId, widgetId, dto);
  }

  @Delete('dashboards/:id/widgets/:widgetId')
  @Permissions('crm.report.delete')
  async removeWidget(@Req() req: AuthenticatedRequest, @Param('widgetId') widgetId: string) {
    return this.crmService.removeWidget(req.user.tenantId, widgetId);
  }

  @Put('dashboards/:id/layout')
  @Permissions('crm.report.update')
  async updateDashboardLayout(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { layout: Array<{ widgetId: string; x: number; y: number; w: number; h: number }> }) {
    return this.crmService.updateDashboardLayout(req.user.tenantId, id, body.layout);
  }

  @Get('dashboards/widget-data/:widgetId')
  @Permissions('crm.report.read')
  async getWidgetData(@Req() req: AuthenticatedRequest, @Param('widgetId') widgetId: string) {
    return this.crmService.getWidgetData(req.user.tenantId, widgetId);
  }

  @Get('dashboards/available-metrics')
  @Permissions('crm.report.read')
  async getAvailableMetrics() {
    return this.crmService.getAvailableMetrics();
  }
}