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
}