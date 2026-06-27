import { Controller, Get, Post, Put, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
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
  CreateCrmDashboardInput, UpdateCrmDashboardInput, CreateDashboardWidgetInput, UpdateDashboardWidgetInput } from '@unerp/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) { }

  // ── CUSTOMERS ─────────────────────────────────

  @ApiOperation({ summary: 'Get customers' })
  @Permissions('crm.read')
  @Get('customers')
  @Permissions('crm.contact.read')
  async getCustomers(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCustomers(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get customer by id' })
  @Permissions('crm.read')
  @Get('customers/:id')
  @Permissions('crm.contact.read')
  async getCustomerById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getCustomerById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create customer' })
  @Permissions('crm.create')
  @Post('customers')
  @Permissions('crm.contact.create')
  async createCustomer(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCustomerInput) {
    return this.crmService.createCustomer(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update customer' })
  @Permissions('crm.update')
  @Put('customers/:id')
  @Permissions('crm.contact.update')
  async updateCustomer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCustomerInput) {
    return this.crmService.updateCustomer(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete customer' })
  @Permissions('crm.delete')
  @Delete('customers/:id')
  @Permissions('crm.contact.delete')
  async deleteCustomer(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCustomer(req.user.tenantId, id);
  }

  // ── VENDORS ────────────────────────────────────

  @ApiOperation({ summary: 'Get vendors' })
  @Permissions('crm.read')
  @Get('vendors')
  @Permissions('procurement.vendor.read')
  async getVendors(@Req() req: AuthenticatedRequest) {
    return this.crmService.getVendors(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create vendor' })
  @Permissions('crm.create')
  @Post('vendors')
  @Permissions('procurement.vendor.create')
  async createVendor(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateVendorInput) {
    return this.crmService.createVendor(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  // ── CONTACTS ──────────────────────────────────

  @ApiOperation({ summary: 'Get contacts' })
  @Permissions('crm.read')
  @Get('contacts')
  @Permissions('crm.contact.read')
  async getContacts(@Req() req: AuthenticatedRequest, @Query('customerId') customerId?: string) {
    return this.crmService.getContacts(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Create contact' })
  @Permissions('crm.create')
  @Post('contacts')
  @Permissions('crm.contact.create')
  async createContact(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateContactInput) {
    return this.crmService.createContact(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update contact' })
  @Permissions('crm.update')
  @Put('contacts/:id')
  @Permissions('crm.contact.update')
  async updateContact(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateContactInput) {
    return this.crmService.updateContact(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete contact' })
  @Permissions('crm.delete')
  @Delete('contacts/:id')
  @Permissions('crm.contact.delete')
  async deleteContact(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteContact(req.user.tenantId, id);
  }

  // ── LEAD SOURCES ──────────────────────────────

  @ApiOperation({ summary: 'Get lead sources' })
  @Permissions('crm.read')
  @Get('lead-sources')
  @Permissions('crm.lead.read')
  async getLeadSources(@Req() req: AuthenticatedRequest) {
    return this.crmService.getLeadSources(req.user.tenantId);
  }

  // ── LEADS ─────────────────────────────────────

  @ApiOperation({ summary: 'Get leads' })
  @Permissions('crm.read')
  @Get('leads')
  @Permissions('crm.lead.read')
  async getLeads(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.crmService.getLeads(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Get lead by id' })
  @Permissions('crm.read')
  @Get('leads/:id')
  @Permissions('crm.lead.read')
  async getLeadById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getLeadById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create lead' })
  @Permissions('crm.create')
  @Post('leads')
  @Permissions('crm.lead.create')
  async createLead(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateLeadInput) {
    return this.crmService.createLead(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update lead' })
  @Permissions('crm.update')
  @Put('leads/:id')
  @Permissions('crm.lead.update')
  async updateLead(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateLeadInput) {
    return this.crmService.updateLead(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Update lead status' })
  @Permissions('crm.update')
  @Patch('leads/:id/status')
  @Permissions('crm.lead.update')
  async updateLeadStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { status: string }) {
    return this.crmService.updateLeadStatus(req.user.tenantId, id, body.status);
  }

  @ApiOperation({ summary: 'Convert lead' })
  @Permissions('crm.create')
  @Post('leads/:id/convert')
  @Permissions('crm.lead.create')
  async convertLead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) body: { customerName?: string; opportunityName?: string; opportunityAmount?: number }
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

  @ApiOperation({ summary: 'Delete lead' })
  @Permissions('crm.delete')
  @Delete('leads/:id')
  @Permissions('crm.lead.delete')
  async deleteLead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteLead(req.user.tenantId, id);
  }

  // ── SALES PIPELINES ───────────────────────────

  @ApiOperation({ summary: 'Get pipelines' })
  @Permissions('crm.read')
  @Get('pipelines')
  @Permissions('crm.opportunity.read')
  async getPipelines(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPipelines(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create pipeline' })
  @Permissions('crm.create')
  @Post('pipelines')
  @Permissions('crm.opportunity.create')
  async createPipeline(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSalesPipelineInput) {
    return this.crmService.createPipeline(req.user.tenantId, dto);
  }

  // ── OPPORTUNITIES ─────────────────────────────

  @ApiOperation({ summary: 'Get opportunities' })
  @Permissions('crm.read')
  @Get('opportunities')
  @Permissions('crm.opportunity.read')
  async getOpportunities(
    @Req() req: AuthenticatedRequest,
    @Query('pipelineId') pipelineId?: string,
    @Query('stage') stage?: string
  ) {
    return this.crmService.getOpportunities(req.user.tenantId, pipelineId, stage);
  }

  @ApiOperation({ summary: 'Get opportunity by id' })
  @Permissions('crm.read')
  @Get('opportunities/:id')
  @Permissions('crm.opportunity.read')
  async getOpportunityById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getOpportunityById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create opportunity' })
  @Permissions('crm.create')
  @Post('opportunities')
  @Permissions('crm.opportunity.create')
  async createOpportunity(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateOpportunityInput) {
    return this.crmService.createOpportunity(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update opportunity' })
  @Permissions('crm.update')
  @Put('opportunities/:id')
  @Permissions('crm.opportunity.update')
  async updateOpportunity(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateOpportunityInput) {
    return this.crmService.updateOpportunity(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Update opportunity stage' })
  @Permissions('crm.update')
  @Patch('opportunities/:id/stage')
  @Permissions('crm.opportunity.update')
  async updateOpportunityStage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) body: { stage: string; probability?: number; actualCloseDate?: string; lossReason?: string }
  ) {
    return this.crmService.updateOpportunityStage(req.user.tenantId, id, body.stage, body.probability, body.actualCloseDate, body.lossReason);
  }

  @ApiOperation({ summary: 'Delete opportunity' })
  @Permissions('crm.delete')
  @Delete('opportunities/:id')
  @Permissions('crm.opportunity.delete')
  async deleteOpportunity(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteOpportunity(req.user.tenantId, id);
  }

  // ── ACTIVITIES ────────────────────────────────

  @ApiOperation({ summary: 'Get activities' })
  @Permissions('crm.read')
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

  @ApiOperation({ summary: 'Create activity' })
  @Permissions('crm.create')
  @Post('activities')
  @Permissions('crm.activity.create')
  async createActivity(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateActivityInput) {
    return this.crmService.createActivity(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Complete activity' })
  @Permissions('crm.update')
  @Patch('activities/:id/complete')
  @Permissions('crm.activity.update')
  async completeActivity(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.completeActivity(req.user.tenantId, id);
  }

  // ── EMAIL TEMPLATES ───────────────────────────

  @ApiOperation({ summary: 'Get email templates' })
  @Permissions('crm.read')
  @Get('email-templates')
  @Permissions('crm.settings.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.crmService.getEmailTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create email template' })
  @Permissions('crm.create')
  @Post('email-templates')
  @Permissions('crm.settings.create')
  async createEmailTemplate(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateEmailTemplateInput) {
    return this.crmService.createEmailTemplate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update email template' })
  @Permissions('crm.update')
  @Put('email-templates/:id')
  @Permissions('crm.settings.update')
  async updateEmailTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateEmailTemplateInput) {
    return this.crmService.updateEmailTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete email template' })
  @Permissions('crm.delete')
  @Delete('email-templates/:id')
  @Permissions('crm.settings.delete')
  async deleteEmailTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteEmailTemplate(req.user.tenantId, id);
  }

  // ── ANALYTICS ─────────────────────────────────

  @ApiOperation({ summary: 'Get pipeline funnel' })
  @Permissions('crm.read')
  @Get('analytics/pipeline-funnel')
  @Permissions('crm.report.read')
  async getPipelineFunnel(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPipelineFunnel(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get win rate' })
  @Permissions('crm.read')
  @Get('analytics/win-rate')
  @Permissions('crm.report.read')
  async getWinRate(@Req() req: AuthenticatedRequest) {
    return this.crmService.getWinRate(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get lead source breakdown' })
  @Permissions('crm.read')
  @Get('analytics/lead-source-breakdown')
  @Permissions('crm.report.read')
  async getLeadSourceBreakdown(@Req() req: AuthenticatedRequest) {
    return this.crmService.getLeadSourceBreakdown(req.user.tenantId);
  }

  // ── CAMPAIGNS ─────────────────────────────────

  @ApiOperation({ summary: 'Get campaigns' })
  @Permissions('crm.read')
  @Get('campaigns')
  @Permissions('crm.lead.read')
  async getCampaigns(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCampaigns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create campaign' })
  @Permissions('crm.create')
  @Post('campaigns')
  @Permissions('crm.lead.create')
  async createCampaign(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCampaignInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.crmService.createCampaign(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  // ── PHASE 1: OPPORTUNITY LINE ITEMS ───────────

  @ApiOperation({ summary: 'Get opportunity line items' })
  @Permissions('crm.read')
  @Get('opportunities/:id/line-items')
  @Permissions('crm.opportunity.read')
  async getOpportunityLineItems(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getOpportunityLineItems(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add opportunity line item' })
  @Permissions('crm.create')
  @Post('opportunities/:id/line-items')
  @Permissions('crm.opportunity.update')
  async addOpportunityLineItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: CreateOpportunityLineItemInput) {
    return this.crmService.addOpportunityLineItem(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Update opportunity line item' })
  @Permissions('crm.update')
  @Put('opportunities/:id/line-items/:itemId')
  @Permissions('crm.opportunity.update')
  async updateOpportunityLineItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string, @ZodBody(z.any()) dto: UpdateOpportunityLineItemInput) {
    return this.crmService.updateOpportunityLineItem(req.user.tenantId, id, itemId, dto);
  }

  @ApiOperation({ summary: 'Delete opportunity line item' })
  @Permissions('crm.delete')
  @Delete('opportunities/:id/line-items/:itemId')
  @Permissions('crm.opportunity.update')
  async deleteOpportunityLineItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.crmService.deleteOpportunityLineItem(req.user.tenantId, id, itemId);
  }

  // ── PHASE 1: PRICE BOOKS ─────────────────────

  @ApiOperation({ summary: 'Get crm products' })
  @Permissions('crm.read')
  @Get('products')
  @Permissions('crm.product.read')
  async getCrmProducts(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCrmProducts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get price books' })
  @Permissions('crm.read')
  @Get('price-books')
  @Permissions('crm.product.read')
  async getPriceBooks(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPriceBooks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create price book' })
  @Permissions('crm.create')
  @Post('price-books')
  @Permissions('crm.product.create')
  async createPriceBook(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePriceBookInput) {
    return this.crmService.createPriceBook(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update price book' })
  @Permissions('crm.update')
  @Put('price-books/:id')
  @Permissions('crm.product.update')
  async updatePriceBook(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdatePriceBookInput) {
    return this.crmService.updatePriceBook(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete price book' })
  @Permissions('crm.delete')
  @Delete('price-books/:id')
  @Permissions('crm.product.delete')
  async deletePriceBook(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deletePriceBook(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get price book entries' })
  @Permissions('crm.read')
  @Get('price-books/:id/entries')
  @Permissions('crm.product.read')
  async getPriceBookEntries(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getPriceBookEntries(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add price book entry' })
  @Permissions('crm.create')
  @Post('price-books/:id/entries')
  @Permissions('crm.product.create')
  async addPriceBookEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: CreatePriceBookEntryInput) {
    return this.crmService.addPriceBookEntry(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete price book entry' })
  @Permissions('crm.delete')
  @Delete('price-book-entries/:id')
  @Permissions('crm.product.delete')
  async deletePriceBookEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deletePriceBookEntry(req.user.tenantId, id);
  }

  // ── PHASE 1: REVENUE ANALYTICS ───────────────

  @ApiOperation({ summary: 'Get revenue forecast' })
  @Permissions('crm.read')
  @Get('analytics/revenue-forecast')
  @Permissions('crm.report.read')
  async getRevenueForecast(@Req() req: AuthenticatedRequest) {
    return this.crmService.getRevenueForecast(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get deal aging' })
  @Permissions('crm.read')
  @Get('analytics/deal-aging')
  @Permissions('crm.report.read')
  async getDealAging(@Req() req: AuthenticatedRequest) {
    return this.crmService.getDealAging(req.user.tenantId);
  }

  // ── PHASE 2: CONTACT TAGS & 360 ──────────────

  @ApiOperation({ summary: 'Get contact tags' })
  @Permissions('crm.read')
  @Get('contacts/tags')
  @Permissions('crm.contact.read')
  async getContactTags(@Req() req: AuthenticatedRequest) {
    return this.crmService.getContactTags(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create contact tag' })
  @Permissions('crm.create')
  @Post('contacts/tags')
  @Permissions('crm.contact.create')
  async createContactTag(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateContactTagInput) {
    return this.crmService.createContactTag(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Delete contact tag' })
  @Permissions('crm.delete')
  @Delete('contacts/tags/:id')
  @Permissions('crm.contact.delete')
  async deleteContactTag(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteContactTag(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Assign contact tag' })
  @Permissions('crm.create')
  @Post('contacts/:id/tags')
  @Permissions('crm.contact.update')
  async assignContactTag(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { tagId: string }) {
    return this.crmService.assignContactTag(req.user.tenantId, id, body.tagId);
  }

  @ApiOperation({ summary: 'Remove contact tag' })
  @Permissions('crm.delete')
  @Delete('contacts/:id/tags/:tagId')
  @Permissions('crm.contact.update')
  async removeContactTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.crmService.removeContactTag(id, tagId);
  }

  @ApiOperation({ summary: 'Get contact timeline' })
  @Permissions('crm.read')
  @Get('contacts/:id/timeline')
  @Permissions('crm.contact.read')
  async getContactTimeline(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getContactTimeline(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Find duplicate contacts' })
  @Permissions('crm.read')
  @Get('contacts/duplicates')
  @Permissions('crm.contact.read')
  async findDuplicateContacts(@Req() req: AuthenticatedRequest) {
    return this.crmService.findDuplicateContacts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Merge contacts' })
  @Permissions('crm.create')
  @Post('contacts/merge')
  @Permissions('crm.contact.update')
  async mergeContacts(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: MergeContactsInput) {
    return this.crmService.mergeContacts(req.user.tenantId, dto);
  }

  // ── PHASE 2: PIPELINE HEALTH ─────────────────

  @ApiOperation({ summary: 'Get stage duration' })
  @Permissions('crm.read')
  @Get('analytics/stage-duration')
  @Permissions('crm.report.read')
  async getStageDuration(@Req() req: AuthenticatedRequest) {
    return this.crmService.getStageDuration(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get pipeline health' })
  @Permissions('crm.read')
  @Get('analytics/pipeline-health')
  @Permissions('crm.report.read')
  async getPipelineHealth(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPipelineHealth(req.user.tenantId);
  }

  // ── PHASE 3: SALES TARGETS ───────────────────

  @ApiOperation({ summary: 'Get sales targets' })
  @Permissions('crm.read')
  @Get('targets')
  @Permissions('crm.settings.read')
  async getSalesTargets(@Req() req: AuthenticatedRequest) {
    return this.crmService.getSalesTargets(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create sales target' })
  @Permissions('crm.create')
  @Post('targets')
  @Permissions('crm.settings.create')
  async createSalesTarget(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSalesTargetInput) {
    return this.crmService.createSalesTarget(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update sales target' })
  @Permissions('crm.update')
  @Put('targets/:id')
  @Permissions('crm.settings.update')
  async updateSalesTarget(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateSalesTargetInput) {
    return this.crmService.updateSalesTarget(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete sales target' })
  @Permissions('crm.delete')
  @Delete('targets/:id')
  @Permissions('crm.settings.delete')
  async deleteSalesTarget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteSalesTarget(req.user.tenantId, id);
  }

  // ── PHASE 3: FORECASTING & ANALYTICS ─────────

  @ApiOperation({ summary: 'Get forecast' })
  @Permissions('crm.read')
  @Get('analytics/forecast')
  @Permissions('crm.report.read')
  async getForecast(@Req() req: AuthenticatedRequest) {
    return this.crmService.getForecast(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get rep performance' })
  @Permissions('crm.read')
  @Get('analytics/rep-performance')
  @Permissions('crm.report.read')
  async getRepPerformance(@Req() req: AuthenticatedRequest) {
    return this.crmService.getRepPerformance(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get conversion funnel' })
  @Permissions('crm.read')
  @Get('analytics/conversion-funnel')
  @Permissions('crm.report.read')
  async getConversionFunnel(@Req() req: AuthenticatedRequest) {
    return this.crmService.getConversionFunnel(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get cohort analysis' })
  @Permissions('crm.read')
  @Get('analytics/cohort')
  @Permissions('crm.report.read')
  async getCohortAnalysis(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCohortAnalysis(req.user.tenantId);
  }

  // ── PHASE 3: SAVED REPORTS ───────────────────

  @ApiOperation({ summary: 'Get saved reports' })
  @Permissions('crm.read')
  @Get('reports/saved')
  @Permissions('crm.report.read')
  async getSavedReports(@Req() req: AuthenticatedRequest) {
    return this.crmService.getSavedReports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create saved report' })
  @Permissions('crm.create')
  @Post('reports/saved')
  @Permissions('crm.report.create')
  async createSavedReport(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSavedReportInput) {
    return this.crmService.createSavedReport(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Run saved report' })
  @Permissions('crm.read')
  @Get('reports/saved/:id/run')
  @Permissions('crm.report.read')
  async runSavedReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.runSavedReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Delete saved report' })
  @Permissions('crm.delete')
  @Delete('reports/saved/:id')
  @Permissions('crm.report.delete')
  async deleteSavedReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteSavedReport(req.user.tenantId, id);
  }

  // ── PHASE 4: WORKFLOW RULES ──────────────────

  @ApiOperation({ summary: 'Get workflow rules' })
  @Permissions('crm.read')
  @Get('workflows')
  @Permissions('crm.settings.read')
  async getWorkflowRules(@Req() req: AuthenticatedRequest) {
    return this.crmService.getWorkflowRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create workflow rule' })
  @Permissions('crm.create')
  @Post('workflows')
  @Permissions('crm.settings.create')
  async createWorkflowRule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCrmWorkflowRuleInput) {
    return this.crmService.createWorkflowRule(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Update workflow rule' })
  @Permissions('crm.update')
  @Put('workflows/:id')
  @Permissions('crm.settings.update')
  async updateWorkflowRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCrmWorkflowRuleInput) {
    return this.crmService.updateWorkflowRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Toggle workflow rule' })
  @Permissions('crm.update')
  @Patch('workflows/:id/toggle')
  @Permissions('crm.settings.update')
  async toggleWorkflowRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.toggleWorkflowRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Delete workflow rule' })
  @Permissions('crm.delete')
  @Delete('workflows/:id')
  @Permissions('crm.settings.delete')
  async deleteWorkflowRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteWorkflowRule(req.user.tenantId, id);
  }

  // ── PHASE 4: EMAIL SEQUENCES ─────────────────

  @ApiOperation({ summary: 'Get email sequences' })
  @Permissions('crm.read')
  @Get('sequences')
  @Permissions('crm.settings.read')
  async getEmailSequences(@Req() req: AuthenticatedRequest) {
    return this.crmService.getEmailSequences(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create email sequence' })
  @Permissions('crm.create')
  @Post('sequences')
  @Permissions('crm.settings.create')
  async createEmailSequence(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateEmailSequenceInput) {
    return this.crmService.createEmailSequence(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Enroll in sequence' })
  @Permissions('crm.create')
  @Post('sequences/:id/enroll')
  @Permissions('crm.settings.create')
  async enrollInSequence(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: EnrollSequenceInput) {
    return this.crmService.enrollInSequence(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Pause enrollment' })
  @Permissions('crm.update')
  @Patch('sequences/enrollments/:id/pause')
  @Permissions('crm.settings.update')
  async pauseEnrollment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.pauseEnrollment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Delete email sequence' })
  @Permissions('crm.delete')
  @Delete('sequences/:id')
  @Permissions('crm.settings.delete')
  async deleteEmailSequence(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteEmailSequence(req.user.tenantId, id);
  }

  // ── PHASE 5: TERRITORIES ─────────────────────

  @ApiOperation({ summary: 'Get territories' })
  @Permissions('crm.read')
  @Get('territories')
  @Permissions('crm.settings.read')
  async getTerritories(@Req() req: AuthenticatedRequest) {
    return this.crmService.getTerritories(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create territory' })
  @Permissions('crm.create')
  @Post('territories')
  @Permissions('crm.settings.create')
  async createTerritory(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSalesTerritoryInput) {
    return this.crmService.createTerritory(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update territory' })
  @Permissions('crm.update')
  @Put('territories/:id')
  @Permissions('crm.settings.update')
  async updateTerritory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateSalesTerritoryInput) {
    return this.crmService.updateTerritory(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete territory' })
  @Permissions('crm.delete')
  @Delete('territories/:id')
  @Permissions('crm.settings.delete')
  async deleteTerritory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteTerritory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add team member' })
  @Permissions('crm.create')
  @Post('territories/:id/members')
  @Permissions('crm.settings.create')
  async addTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: AddTeamMemberInput) {
    return this.crmService.addTeamMember(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remove team member' })
  @Permissions('crm.delete')
  @Delete('territories/:id/members/:userId')
  @Permissions('crm.settings.delete')
  async removeTeamMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.crmService.removeTeamMember(req.user.tenantId, id, userId);
  }

  @ApiOperation({ summary: 'Get territory performance' })
  @Permissions('crm.read')
  @Get('analytics/territory-performance')
  @Permissions('crm.report.read')
  async getTerritoryPerformance(@Req() req: AuthenticatedRequest) {
    return this.crmService.getTerritoryPerformance(req.user.tenantId);
  }

  // ── PHASE 5: COMMISSIONS ─────────────────────

  @ApiOperation({ summary: 'Get commission rules' })
  @Permissions('crm.read')
  @Get('commissions/rules')
  @Permissions('crm.settings.read')
  async getCommissionRules(@Req() req: AuthenticatedRequest) {
    return this.crmService.getCommissionRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create commission rule' })
  @Permissions('crm.create')
  @Post('commissions/rules')
  @Permissions('crm.settings.create')
  async createCommissionRule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCommissionRuleInput) {
    return this.crmService.createCommissionRule(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update commission rule' })
  @Permissions('crm.update')
  @Put('commissions/rules/:id')
  @Permissions('crm.settings.update')
  async updateCommissionRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCommissionRuleInput) {
    return this.crmService.updateCommissionRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete commission rule' })
  @Permissions('crm.delete')
  @Delete('commissions/rules/:id')
  @Permissions('crm.settings.delete')
  async deleteCommissionRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCommissionRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get commission entries' })
  @Permissions('crm.read')
  @Get('commissions/entries')
  @Permissions('crm.report.read')
  async getCommissionEntries(@Req() req: AuthenticatedRequest, @Query('userId') userId?: string) {
    return this.crmService.getCommissionEntries(req.user.tenantId, userId);
  }

  @ApiOperation({ summary: 'Calculate commissions' })
  @Permissions('crm.create')
  @Post('commissions/calculate')
  @Permissions('crm.settings.create')
  async calculateCommissions(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CalculateCommissionsInput) {
    return this.crmService.calculateCommissions(req.user.tenantId, dto);
  }

  // ── PHASE 6: WEB FORMS ───────────────────────

  @ApiOperation({ summary: 'Get web forms' })
  @Permissions('crm.read')
  @Get('forms')
  @Permissions('crm.settings.read')
  async getWebForms(@Req() req: AuthenticatedRequest) {
    return this.crmService.getWebForms(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create web form' })
  @Permissions('crm.create')
  @Post('forms')
  @Permissions('crm.settings.create')
  async createWebForm(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateWebToLeadFormInput) {
    return this.crmService.createWebForm(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update web form' })
  @Permissions('crm.update')
  @Put('forms/:id')
  @Permissions('crm.settings.update')
  async updateWebForm(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateWebToLeadFormInput) {
    return this.crmService.updateWebForm(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete web form' })
  @Permissions('crm.delete')
  @Delete('forms/:id')
  @Permissions('crm.settings.delete')
  async deleteWebForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteWebForm(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Submit web form' })
  @Permissions('crm.create')
  @Post('forms/:id/submit')
  async submitWebForm(@Param('id') id: string, @ZodBody(z.any()) dto: SubmitWebFormInput) {
    return this.crmService.submitWebForm(id, dto);
  }

  @ApiOperation({ summary: 'Get web form embed' })
  @Permissions('crm.read')
  @Get('forms/:id/embed')
  @Permissions('crm.settings.read')
  async getWebFormEmbed(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getWebFormEmbed(req.user.tenantId, id);
  }

  // ── PHASE 6: DOCUMENTS ───────────────────────

  @ApiOperation({ summary: 'Get crm documents' })
  @Permissions('crm.read')
  @Get('documents')
  @Permissions('crm.contact.read')
  async getCrmDocuments(@Req() req: AuthenticatedRequest, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.crmService.getCrmDocuments(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Create crm document' })
  @Permissions('crm.create')
  @Post('documents')
  @Permissions('crm.contact.create')
  async createCrmDocument(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCrmDocumentInput) {
    return this.crmService.createCrmDocument(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Delete crm document' })
  @Permissions('crm.delete')
  @Delete('documents/:id')
  @Permissions('crm.contact.delete')
  async deleteCrmDocument(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCrmDocument(req.user.tenantId, id);
  }

  // ── PHASE 6: IMPORT/EXPORT ───────────────────

  @ApiOperation({ summary: 'Import contacts' })
  @Permissions('crm.create')
  @Post('contacts/import')
  @Permissions('crm.contact.create')
  async importContacts(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { rows: Array<Record<string, string>> }) {
    return this.crmService.importContacts(req.user.tenantId, req.user.orgId || 'org-system-default', body.rows);
  }

  @ApiOperation({ summary: 'Export contacts' })
  @Permissions('crm.read')
  @Get('contacts/export')
  @Permissions('crm.contact.read')
  async exportContacts(@Req() req: AuthenticatedRequest) {
    return this.crmService.exportContacts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Import leads' })
  @Permissions('crm.create')
  @Post('leads/import')
  @Permissions('crm.lead.create')
  async importLeads(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { rows: Array<Record<string, string>> }) {
    return this.crmService.importLeads(req.user.tenantId, req.user.orgId || 'org-system-default', body.rows);
  }

  @ApiOperation({ summary: 'Export leads' })
  @Permissions('crm.read')
  @Get('leads/export')
  @Permissions('crm.lead.read')
  async exportLeads(@Req() req: AuthenticatedRequest) {
    return this.crmService.exportLeads(req.user.tenantId);
  }

  // ── PHASE 7: CUSTOM FIELDS ──────────────────

  @ApiOperation({ summary: 'Get custom fields' })
  @Permissions('crm.read')
  @Get('custom-fields')
  @Permissions('crm.settings.read')
  async getCustomFields(@Req() req: AuthenticatedRequest, @Query('entity') entity?: string) {
    return this.crmService.getCustomFields(req.user.tenantId, entity);
  }

  @ApiOperation({ summary: 'Create custom field' })
  @Permissions('crm.create')
  @Post('custom-fields')
  @Permissions('crm.settings.create')
  async createCustomField(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCustomFieldInput) {
    return this.crmService.createCustomField(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update custom field' })
  @Permissions('crm.update')
  @Put('custom-fields/:id')
  @Permissions('crm.settings.update')
  async updateCustomField(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCustomFieldInput) {
    return this.crmService.updateCustomField(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete custom field' })
  @Permissions('crm.delete')
  @Delete('custom-fields/:id')
  @Permissions('crm.settings.delete')
  async deleteCustomField(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteCustomField(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get custom field values' })
  @Permissions('crm.read')
  @Get('custom-field-values/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getCustomFieldValues(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getCustomFieldValues(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Upsert custom field values' })
  @Permissions('crm.update')
  @Put('custom-field-values/:entityType/:entityId')
  @Permissions('crm.contact.update')
  async upsertCustomFieldValues(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string, @ZodBody(z.any()) body: { values: Array<{ fieldId: string; value: string | null }> }) {
    return this.crmService.upsertCustomFieldValues(req.user.tenantId, entityType, entityId, body.values);
  }

  @ApiOperation({ summary: 'Get record types' })
  @Permissions('crm.read')
  @Get('record-types')
  @Permissions('crm.settings.read')
  async getRecordTypes(@Req() req: AuthenticatedRequest, @Query('entity') entity?: string) {
    return this.crmService.getRecordTypes(req.user.tenantId, entity);
  }

  @ApiOperation({ summary: 'Create record type' })
  @Permissions('crm.create')
  @Post('record-types')
  @Permissions('crm.settings.create')
  async createRecordType(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateRecordTypeInput) {
    return this.crmService.createRecordType(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update record type' })
  @Permissions('crm.update')
  @Put('record-types/:id')
  @Permissions('crm.settings.update')
  async updateRecordType(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateRecordTypeInput) {
    return this.crmService.updateRecordType(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete record type' })
  @Permissions('crm.delete')
  @Delete('record-types/:id')
  @Permissions('crm.settings.delete')
  async deleteRecordType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteRecordType(req.user.tenantId, id);
  }

  // ── PHASE 8: APPROVALS ──────────────────────

  @ApiOperation({ summary: 'Get approval processes' })
  @Permissions('crm.read')
  @Get('approval-processes')
  @Permissions('crm.settings.read')
  async getApprovalProcesses(@Req() req: AuthenticatedRequest) {
    return this.crmService.getApprovalProcesses(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create approval process' })
  @Permissions('crm.create')
  @Post('approval-processes')
  @Permissions('crm.settings.create')
  async createApprovalProcess(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateApprovalProcessInput) {
    return this.crmService.createApprovalProcess(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update approval process' })
  @Permissions('crm.update')
  @Put('approval-processes/:id')
  @Permissions('crm.settings.update')
  async updateApprovalProcess(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateApprovalProcessInput) {
    return this.crmService.updateApprovalProcess(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete approval process' })
  @Permissions('crm.delete')
  @Delete('approval-processes/:id')
  @Permissions('crm.settings.delete')
  async deleteApprovalProcess(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteApprovalProcess(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Submit for approval' })
  @Permissions('crm.create')
  @Post('approval-requests')
  @Permissions('crm.contact.create')
  async submitForApproval(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { entityType: string; entityId: string; processId?: string }) {
    return this.crmService.submitForApproval(req.user.tenantId, req.user.userId, body.entityType, body.entityId, body.processId);
  }

  @ApiOperation({ summary: 'Get pending approvals' })
  @Permissions('crm.read')
  @Get('approval-requests/pending')
  @Permissions('crm.contact.read')
  async getPendingApprovals(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPendingApprovals(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get approval history' })
  @Permissions('crm.read')
  @Get('approval-requests/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getApprovalHistory(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getApprovalHistory(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Approve request' })
  @Permissions('crm.create')
  @Post('approval-requests/:id/approve')
  @Permissions('crm.contact.update')
  async approveRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { comments?: string }) {
    return this.crmService.approveRequest(req.user.tenantId, id, req.user.userId, body.comments);
  }

  @ApiOperation({ summary: 'Reject request' })
  @Permissions('crm.create')
  @Post('approval-requests/:id/reject')
  @Permissions('crm.contact.update')
  async rejectRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { comments: string }) {
    return this.crmService.rejectRequest(req.user.tenantId, id, req.user.userId, body.comments);
  }

  @ApiOperation({ summary: 'Recall request' })
  @Permissions('crm.create')
  @Post('approval-requests/:id/recall')
  @Permissions('crm.contact.update')
  async recallRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.recallRequest(req.user.tenantId, id, req.user.userId);
  }

  // ── PHASE 9: QUOTATION TEMPLATES & CPQ ──────

  @ApiOperation({ summary: 'Get quotation templates' })
  @Permissions('crm.read')
  @Get('quotation-templates')
  @Permissions('crm.settings.read')
  async getQuotationTemplates(@Req() req: AuthenticatedRequest) {
    return this.crmService.getQuotationTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create quotation template' })
  @Permissions('crm.create')
  @Post('quotation-templates')
  @Permissions('crm.settings.create')
  async createQuotationTemplate(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateQuotationTemplateInput) {
    return this.crmService.createQuotationTemplate(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update quotation template' })
  @Permissions('crm.update')
  @Put('quotation-templates/:id')
  @Permissions('crm.settings.update')
  async updateQuotationTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateQuotationTemplateInput) {
    return this.crmService.updateQuotationTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete quotation template' })
  @Permissions('crm.delete')
  @Delete('quotation-templates/:id')
  @Permissions('crm.settings.delete')
  async deleteQuotationTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteQuotationTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create quotation version' })
  @Permissions('crm.create')
  @Post('quotations/:id/versions')
  @Permissions('crm.opportunity.update')
  async createQuotationVersion(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { changeNote?: string }) {
    return this.crmService.createQuotationVersion(req.user.tenantId, id, req.user.userId, body.changeNote);
  }

  @ApiOperation({ summary: 'Get quotation versions' })
  @Permissions('crm.read')
  @Get('quotations/:id/versions')
  @Permissions('crm.opportunity.read')
  async getQuotationVersions(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getQuotationVersions(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Clone quotation' })
  @Permissions('crm.create')
  @Post('quotations/:id/clone')
  @Permissions('crm.opportunity.create')
  async cloneQuotation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.cloneQuotation(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Send for signature' })
  @Permissions('crm.create')
  @Post('quotations/:id/send-for-signature')
  @Permissions('crm.opportunity.update')
  async sendForSignature(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { signerName: string; signerEmail: string }) {
    return this.crmService.sendForSignature(req.user.tenantId, id, body.signerName, body.signerEmail);
  }

  @ApiOperation({ summary: 'Get quotation by sign token' })
  @Permissions('crm.read')
  @Get('quotation-sign/:token')
  async getQuotationBySignToken(@Param('token') token: string) {
    return this.crmService.getQuotationBySignToken(token);
  }

  @ApiOperation({ summary: 'Submit signature' })
  @Permissions('crm.create')
  @Post('quotation-sign/:token')
  async submitSignature(@Param('token') token: string, @ZodBody(z.any()) body: { signatureData: string }, @Req() req: Request) {
    return this.crmService.submitSignature(token, body.signatureData, req.ip || 'unknown');
  }

  // ── PHASE 10: COMMENTS & COLLABORATION ──────

  @ApiOperation({ summary: 'Get comments' })
  @Permissions('crm.read')
  @Get('comments/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getComments(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getComments(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Create comment' })
  @Permissions('crm.create')
  @Post('comments/:entityType/:entityId')
  @Permissions('crm.contact.create')
  async createComment(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string, @ZodBody(z.any()) dto: CreateCrmCommentInput) {
    return this.crmService.createComment(req.user.tenantId, req.user.userId, entityType, entityId, dto);
  }

  @ApiOperation({ summary: 'Update comment' })
  @Permissions('crm.update')
  @Put('comments/:id')
  @Permissions('crm.contact.update')
  async updateComment(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { body: string }) {
    return this.crmService.updateComment(req.user.tenantId, id, req.user.userId, body.body);
  }

  @ApiOperation({ summary: 'Delete comment' })
  @Permissions('crm.delete')
  @Delete('comments/:id')
  @Permissions('crm.contact.delete')
  async deleteComment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteComment(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle pin comment' })
  @Permissions('crm.create')
  @Post('comments/:id/pin')
  @Permissions('crm.contact.update')
  async togglePinComment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.togglePinComment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get followers' })
  @Permissions('crm.read')
  @Get('followers/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getFollowers(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getFollowers(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Follow record' })
  @Permissions('crm.create')
  @Post('followers/:entityType/:entityId')
  @Permissions('crm.contact.create')
  async followRecord(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.followRecord(req.user.tenantId, req.user.userId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Unfollow record' })
  @Permissions('crm.delete')
  @Delete('followers/:entityType/:entityId')
  @Permissions('crm.contact.delete')
  async unfollowRecord(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.unfollowRecord(req.user.tenantId, req.user.userId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Get notes' })
  @Permissions('crm.read')
  @Get('notes/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getNotes(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getNotes(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Create note' })
  @Permissions('crm.create')
  @Post('notes/:entityType/:entityId')
  @Permissions('crm.contact.create')
  async createNote(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string, @ZodBody(z.any()) dto: CreateCrmNoteInput) {
    return this.crmService.createNote(req.user.tenantId, req.user.userId, entityType, entityId, dto);
  }

  @ApiOperation({ summary: 'Update note' })
  @Permissions('crm.update')
  @Put('notes/:id')
  @Permissions('crm.contact.update')
  async updateNote(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCrmNoteInput) {
    return this.crmService.updateNote(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete note' })
  @Permissions('crm.delete')
  @Delete('notes/:id')
  @Permissions('crm.contact.delete')
  async deleteNote(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteNote(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Toggle pin note' })
  @Permissions('crm.create')
  @Post('notes/:id/pin')
  @Permissions('crm.contact.update')
  async togglePinNote(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.togglePinNote(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get unified activity feed' })
  @Permissions('crm.read')
  @Get('activity-feed/:entityType/:entityId')
  @Permissions('crm.contact.read')
  async getUnifiedActivityFeed(@Req() req: AuthenticatedRequest, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.crmService.getUnifiedActivityFeed(req.user.tenantId, entityType, entityId);
  }

  // ── PHASE 11: PLAYBOOKS & BATTLECARDS ───────

  @ApiOperation({ summary: 'Get playbooks' })
  @Permissions('crm.read')
  @Get('playbooks')
  @Permissions('crm.settings.read')
  async getPlaybooks(@Req() req: AuthenticatedRequest) {
    return this.crmService.getPlaybooks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create playbook' })
  @Permissions('crm.create')
  @Post('playbooks')
  @Permissions('crm.settings.create')
  async createPlaybook(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePlaybookInput) {
    return this.crmService.createPlaybook(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update playbook' })
  @Permissions('crm.update')
  @Put('playbooks/:id')
  @Permissions('crm.settings.update')
  async updatePlaybook(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdatePlaybookInput) {
    return this.crmService.updatePlaybook(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete playbook' })
  @Permissions('crm.delete')
  @Delete('playbooks/:id')
  @Permissions('crm.settings.delete')
  async deletePlaybook(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deletePlaybook(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get playbook stages' })
  @Permissions('crm.read')
  @Get('playbooks/:id/stages')
  @Permissions('crm.settings.read')
  async getPlaybookStages(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getPlaybookStages(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Upsert playbook stages' })
  @Permissions('crm.update')
  @Put('playbooks/:id/stages')
  @Permissions('crm.settings.update')
  async upsertPlaybookStages(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { stages: Array<{ stageName: string; guidanceNotes?: string; checklist?: unknown[]; requiredFields?: string[]; talkingPoints?: string[]; exitCriteria?: unknown[]; sortOrder?: number }> }) {
    return this.crmService.upsertPlaybookStages(req.user.tenantId, id, body.stages);
  }

  @ApiOperation({ summary: 'Get battlecards' })
  @Permissions('crm.read')
  @Get('battlecards')
  @Permissions('crm.settings.read')
  async getBattlecards(@Req() req: AuthenticatedRequest) {
    return this.crmService.getBattlecards(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create battlecard' })
  @Permissions('crm.create')
  @Post('battlecards')
  @Permissions('crm.settings.create')
  async createBattlecard(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateBattlecardInput) {
    return this.crmService.createBattlecard(req.user.tenantId, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update battlecard' })
  @Permissions('crm.update')
  @Put('battlecards/:id')
  @Permissions('crm.settings.update')
  async updateBattlecard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateBattlecardInput) {
    return this.crmService.updateBattlecard(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete battlecard' })
  @Permissions('crm.delete')
  @Delete('battlecards/:id')
  @Permissions('crm.settings.delete')
  async deleteBattlecard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteBattlecard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get battlecard by competitor' })
  @Permissions('crm.read')
  @Get('battlecards/by-competitor/:competitor')
  @Permissions('crm.settings.read')
  async getBattlecardByCompetitor(@Req() req: AuthenticatedRequest, @Param('competitor') competitor: string) {
    return this.crmService.getBattlecardByCompetitor(req.user.tenantId, competitor);
  }

  @ApiOperation({ summary: 'Get opportunity checklist' })
  @Permissions('crm.read')
  @Get('opportunities/:id/checklist')
  @Permissions('crm.opportunity.read')
  async getOpportunityChecklist(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.getOpportunityChecklist(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Toggle checklist item' })
  @Permissions('crm.update')
  @Put('opportunities/:id/checklist/:itemId')
  @Permissions('crm.opportunity.update')
  async toggleChecklistItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.crmService.toggleChecklistItem(req.user.tenantId, id, itemId, req.user.userId);
  }

  @ApiOperation({ summary: 'Validate stage advance' })
  @Permissions('crm.create')
  @Post('opportunities/:id/validate-stage-advance')
  @Permissions('crm.opportunity.read')
  async validateStageAdvance(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { targetStage: string }) {
    return this.crmService.validateStageAdvance(req.user.tenantId, id, body.targetStage);
  }

  // ── PHASE 12: DASHBOARD BUILDER ─────────────

  @ApiOperation({ summary: 'Get dashboards' })
  @Permissions('crm.read')
  @Get('dashboards')
  @Permissions('crm.report.read')
  async getDashboards(@Req() req: AuthenticatedRequest) {
    return this.crmService.getDashboards(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Create dashboard' })
  @Permissions('crm.create')
  @Post('dashboards')
  @Permissions('crm.report.create')
  async createDashboard(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCrmDashboardInput) {
    return this.crmService.createDashboard(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Update dashboard' })
  @Permissions('crm.update')
  @Put('dashboards/:id')
  @Permissions('crm.report.update')
  async updateDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCrmDashboardInput) {
    return this.crmService.updateDashboard(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete dashboard' })
  @Permissions('crm.delete')
  @Delete('dashboards/:id')
  @Permissions('crm.report.delete')
  async deleteDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.deleteDashboard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Clone dashboard' })
  @Permissions('crm.create')
  @Post('dashboards/:id/clone')
  @Permissions('crm.report.create')
  async cloneDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crmService.cloneDashboard(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Add widget' })
  @Permissions('crm.create')
  @Post('dashboards/:id/widgets')
  @Permissions('crm.report.create')
  async addWidget(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: CreateDashboardWidgetInput) {
    return this.crmService.addWidget(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Update widget' })
  @Permissions('crm.update')
  @Put('dashboards/:id/widgets/:widgetId')
  @Permissions('crm.report.update')
  async updateWidget(@Req() req: AuthenticatedRequest, @Param('widgetId') widgetId: string, @ZodBody(z.any()) dto: UpdateDashboardWidgetInput) {
    return this.crmService.updateWidget(req.user.tenantId, widgetId, dto);
  }

  @ApiOperation({ summary: 'Remove widget' })
  @Permissions('crm.delete')
  @Delete('dashboards/:id/widgets/:widgetId')
  @Permissions('crm.report.delete')
  async removeWidget(@Req() req: AuthenticatedRequest, @Param('widgetId') widgetId: string) {
    return this.crmService.removeWidget(req.user.tenantId, widgetId);
  }

  @ApiOperation({ summary: 'Update dashboard layout' })
  @Permissions('crm.update')
  @Put('dashboards/:id/layout')
  @Permissions('crm.report.update')
  async updateDashboardLayout(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { layout: Array<{ widgetId: string; x: number; y: number; w: number; h: number }> }) {
    return this.crmService.updateDashboardLayout(req.user.tenantId, id, body.layout);
  }

  @ApiOperation({ summary: 'Get widget data' })
  @Permissions('crm.read')
  @Get('dashboards/widget-data/:widgetId')
  @Permissions('crm.report.read')
  async getWidgetData(@Req() req: AuthenticatedRequest, @Param('widgetId') widgetId: string) {
    return this.crmService.getWidgetData(req.user.tenantId, widgetId);
  }

  @ApiOperation({ summary: 'Get available metrics' })
  @Permissions('crm.read')
  @Get('dashboards/available-metrics')
  @Permissions('crm.report.read')
  async getAvailableMetrics() {
    return this.crmService.getAvailableMetrics();
  }
}