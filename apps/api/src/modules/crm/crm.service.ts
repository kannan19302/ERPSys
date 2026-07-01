import { Injectable, Inject } from '@nestjs/common';
import {
  CreateCustomerInput, CreateVendorInput,
  CreateContactInput, CreateLeadInput, CreateOpportunityInput,
  CreateActivityInput, CreateEmailTemplateInput, CreateSalesPipelineInput,
  UpdateCustomerInput, UpdateContactInput, UpdateLeadInput,
  UpdateOpportunityInput, UpdateEmailTemplateInput,
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

import { CrmCustomersService } from './crm-customers.service';
import { CrmContactsService } from './crm-contacts.service';
import { CrmLeadsService } from './crm-leads.service';
import { CrmDealsService } from './crm-deals.service';
import { CrmActivitiesService } from './crm-activities.service';
import { CrmMarketingService } from './crm-marketing.service';
import { CrmSalesOpsService } from './crm-salesops.service';
import { CrmConfigService } from './crm-config.service';
import { CrmCollaborationService } from './crm-collaboration.service';
import { CrmDashboardsService } from './crm-dashboards.service';
import { CrmCasesService, CreateCaseInput, UpdateCaseInput } from './crm-cases.service';

/**
 * CRM facade. Presents the CRM module's public application surface to the
 * controller and delegates to focused domain services (strangler-fig). It owns
 * only the cross-domain aggregators (saved-report execution, dashboard widget
 * data) that must coordinate several domains; every other method is a
 * one-to-one delegation.
 */
@Injectable()
export class CrmService {
  constructor(
    @Inject(CrmCustomersService) private readonly customersService: CrmCustomersService,
    @Inject(CrmContactsService) private readonly contactsService: CrmContactsService,
    @Inject(CrmLeadsService) private readonly leadsService: CrmLeadsService,
    @Inject(CrmDealsService) private readonly dealsService: CrmDealsService,
    @Inject(CrmActivitiesService) private readonly activitiesService: CrmActivitiesService,
    @Inject(CrmMarketingService) private readonly marketingService: CrmMarketingService,
    @Inject(CrmSalesOpsService) private readonly salesOpsService: CrmSalesOpsService,
    @Inject(CrmConfigService) private readonly configService: CrmConfigService,
    @Inject(CrmCollaborationService) private readonly collaborationService: CrmCollaborationService,
    @Inject(CrmDashboardsService) private readonly dashboardsService: CrmDashboardsService,
    @Inject(CrmCasesService) private readonly casesService: CrmCasesService,
  ) {}

  // ── CASES & SLA ───────────────────────────────
  getCases(tenantId: string, filters?: { status?: string; priority?: string; customerId?: string }) { return this.casesService.getCases(tenantId, filters); }
  getCaseById(tenantId: string, id: string) { return this.casesService.getCaseById(tenantId, id); }
  createCase(tenantId: string, orgId: string, dto: CreateCaseInput) { return this.casesService.createCase(tenantId, orgId, dto); }
  updateCase(tenantId: string, id: string, dto: UpdateCaseInput) { return this.casesService.updateCase(tenantId, id, dto); }
  addCaseComment(tenantId: string, caseId: string, dto: { body: string; authorId?: string; isInternal?: boolean }) { return this.casesService.addComment(tenantId, caseId, dto); }
  getCaseSlaStatus(tenantId: string) { return this.casesService.getSlaStatus(tenantId); }

  // ── CUSTOMERS & VENDORS ───────────────────────
  getCustomers(tenantId: string) { return this.customersService.getCustomers(tenantId); }
  getCustomerById(tenantId: string, id: string) { return this.customersService.getCustomerById(tenantId, id); }
  createCustomer(tenantId: string, orgId: string, dto: CreateCustomerInput) { return this.customersService.createCustomer(tenantId, orgId, dto); }
  updateCustomer(tenantId: string, id: string, dto: UpdateCustomerInput) { return this.customersService.updateCustomer(tenantId, id, dto); }
  deleteCustomer(tenantId: string, id: string) { return this.customersService.deleteCustomer(tenantId, id); }
  getVendors(tenantId: string) { return this.customersService.getVendors(tenantId); }
  createVendor(tenantId: string, orgId: string, dto: CreateVendorInput) { return this.customersService.createVendor(tenantId, orgId, dto); }

  // ── CONTACTS ──────────────────────────────────
  getContacts(tenantId: string, customerId?: string) { return this.contactsService.getContacts(tenantId, customerId); }
  createContact(tenantId: string, orgId: string, dto: CreateContactInput) { return this.contactsService.createContact(tenantId, orgId, dto); }
  updateContact(tenantId: string, id: string, dto: UpdateContactInput) { return this.contactsService.updateContact(tenantId, id, dto); }
  deleteContact(tenantId: string, id: string) { return this.contactsService.deleteContact(tenantId, id); }
  getContactTags(tenantId: string) { return this.contactsService.getContactTags(tenantId); }
  createContactTag(tenantId: string, dto: CreateContactTagInput) { return this.contactsService.createContactTag(tenantId, dto); }
  deleteContactTag(tenantId: string, id: string) { return this.contactsService.deleteContactTag(tenantId, id); }
  assignContactTag(tenantId: string, contactId: string, tagId: string) { return this.contactsService.assignContactTag(tenantId, contactId, tagId); }
  removeContactTag(contactId: string, tagId: string) { return this.contactsService.removeContactTag(contactId, tagId); }
  getContactTimeline(tenantId: string, contactId: string) { return this.contactsService.getContactTimeline(tenantId, contactId); }
  findDuplicateContacts(tenantId: string) { return this.contactsService.findDuplicateContacts(tenantId); }
  mergeContacts(tenantId: string, dto: MergeContactsInput) { return this.contactsService.mergeContacts(tenantId, dto); }

  // ── LEADS ─────────────────────────────────────
  getLeadSources(tenantId: string) { return this.leadsService.getLeadSources(tenantId); }
  getLeads(tenantId: string, status?: string) { return this.leadsService.getLeads(tenantId, status); }
  getLeadById(tenantId: string, id: string) { return this.leadsService.getLeadById(tenantId, id); }
  recalculateLeadScore(tenantId: string, leadId: string) { return this.leadsService.recalculateLeadScore(tenantId, leadId); }
  createLead(tenantId: string, orgId: string, dto: CreateLeadInput) { return this.leadsService.createLead(tenantId, orgId, dto); }
  updateLead(tenantId: string, id: string, dto: UpdateLeadInput) { return this.leadsService.updateLead(tenantId, id, dto); }
  updateLeadStatus(tenantId: string, id: string, status: string) { return this.leadsService.updateLeadStatus(tenantId, id, status); }
  convertLead(tenantId: string, orgId: string, leadId: string, customerName?: string, opportunityName?: string, opportunityAmount?: number) { return this.leadsService.convertLead(tenantId, orgId, leadId, customerName, opportunityName, opportunityAmount); }
  deleteLead(tenantId: string, id: string) { return this.leadsService.deleteLead(tenantId, id); }

  // ── PIPELINES & OPPORTUNITIES ─────────────────
  getPipelines(tenantId: string) { return this.dealsService.getPipelines(tenantId); }
  createPipeline(tenantId: string, dto: CreateSalesPipelineInput) { return this.dealsService.createPipeline(tenantId, dto); }
  getOpportunities(tenantId: string, pipelineId?: string, stage?: string) { return this.dealsService.getOpportunities(tenantId, pipelineId, stage); }
  getOpportunityById(tenantId: string, id: string) { return this.dealsService.getOpportunityById(tenantId, id); }
  createOpportunity(tenantId: string, orgId: string, dto: CreateOpportunityInput) { return this.dealsService.createOpportunity(tenantId, orgId, dto); }
  updateOpportunity(tenantId: string, id: string, dto: UpdateOpportunityInput) { return this.dealsService.updateOpportunity(tenantId, id, dto); }
  updateOpportunityStage(tenantId: string, id: string, stage: string, probability?: number, actualCloseDate?: string, lossReason?: string) { return this.dealsService.updateOpportunityStage(tenantId, id, stage, probability, actualCloseDate, lossReason); }
  deleteOpportunity(tenantId: string, id: string) { return this.dealsService.deleteOpportunity(tenantId, id); }
  getOpportunityLineItems(tenantId: string, opportunityId: string) { return this.dealsService.getOpportunityLineItems(tenantId, opportunityId); }
  addOpportunityLineItem(tenantId: string, opportunityId: string, dto: CreateOpportunityLineItemInput) { return this.dealsService.addOpportunityLineItem(tenantId, opportunityId, dto); }
  updateOpportunityLineItem(tenantId: string, opportunityId: string, itemId: string, dto: UpdateOpportunityLineItemInput) { return this.dealsService.updateOpportunityLineItem(tenantId, opportunityId, itemId, dto); }
  deleteOpportunityLineItem(tenantId: string, opportunityId: string, itemId: string) { return this.dealsService.deleteOpportunityLineItem(tenantId, opportunityId, itemId); }

  // ── PRICE BOOKS & PRODUCTS ────────────────────
  getPriceBooks(tenantId: string) { return this.dealsService.getPriceBooks(tenantId); }
  createPriceBook(tenantId: string, orgId: string, dto: CreatePriceBookInput) { return this.dealsService.createPriceBook(tenantId, orgId, dto); }
  updatePriceBook(tenantId: string, id: string, dto: UpdatePriceBookInput) { return this.dealsService.updatePriceBook(tenantId, id, dto); }
  deletePriceBook(tenantId: string, id: string) { return this.dealsService.deletePriceBook(tenantId, id); }
  getPriceBookEntries(tenantId: string, priceBookId: string) { return this.dealsService.getPriceBookEntries(tenantId, priceBookId); }
  addPriceBookEntry(tenantId: string, priceBookId: string, dto: CreatePriceBookEntryInput) { return this.dealsService.addPriceBookEntry(tenantId, priceBookId, dto); }
  deletePriceBookEntry(tenantId: string, entryId: string) { return this.dealsService.deletePriceBookEntry(tenantId, entryId); }
  getCrmProducts(tenantId: string) { return this.dealsService.getCrmProducts(tenantId); }

  // ── ACTIVITIES & EMAIL TEMPLATES ──────────────
  getActivities(tenantId: string, leadId?: string, opportunityId?: string, customerId?: string) { return this.activitiesService.getActivities(tenantId, leadId, opportunityId, customerId); }
  createActivity(tenantId: string, orgId: string, dto: CreateActivityInput) { return this.activitiesService.createActivity(tenantId, orgId, dto); }
  completeActivity(tenantId: string, id: string) { return this.activitiesService.completeActivity(tenantId, id); }
  getEmailTemplates(tenantId: string) { return this.activitiesService.getEmailTemplates(tenantId); }
  createEmailTemplate(tenantId: string, dto: CreateEmailTemplateInput) { return this.activitiesService.createEmailTemplate(tenantId, dto); }
  updateEmailTemplate(tenantId: string, id: string, dto: UpdateEmailTemplateInput) { return this.activitiesService.updateEmailTemplate(tenantId, id, dto); }
  deleteEmailTemplate(tenantId: string, id: string) { return this.activitiesService.deleteEmailTemplate(tenantId, id); }

  // ── ANALYTICS ─────────────────────────────────
  getPipelineFunnel(tenantId: string) { return this.dealsService.getPipelineFunnel(tenantId); }
  getWinRate(tenantId: string) { return this.dealsService.getWinRate(tenantId); }
  getLeadSourceBreakdown(tenantId: string) { return this.dealsService.getLeadSourceBreakdown(tenantId); }
  getRevenueForecast(tenantId: string) { return this.dealsService.getRevenueForecast(tenantId); }
  getDealAging(tenantId: string) { return this.dealsService.getDealAging(tenantId); }
  getStageDuration(tenantId: string) { return this.dealsService.getStageDuration(tenantId); }
  getPipelineHealth(tenantId: string) { return this.dealsService.getPipelineHealth(tenantId); }
  getForecast(tenantId: string) { return this.dealsService.getForecast(tenantId); }
  getRepPerformance(tenantId: string) { return this.dealsService.getRepPerformance(tenantId); }
  getConversionFunnel(tenantId: string) { return this.dealsService.getConversionFunnel(tenantId); }
  getCohortAnalysis(tenantId: string) { return this.dealsService.getCohortAnalysis(tenantId); }

  // ── CAMPAIGNS ─────────────────────────────────
  getCampaigns(tenantId: string) { return this.marketingService.getCampaigns(tenantId); }
  createCampaign(tenantId: string, orgId: string, dto: CreateCampaignInput, createdBy: string) { return this.marketingService.createCampaign(tenantId, orgId, dto, createdBy); }

  // ── SALES TARGETS ─────────────────────────────
  getSalesTargets(tenantId: string) { return this.salesOpsService.getSalesTargets(tenantId); }
  createSalesTarget(tenantId: string, orgId: string, dto: CreateSalesTargetInput) { return this.salesOpsService.createSalesTarget(tenantId, orgId, dto); }
  updateSalesTarget(tenantId: string, id: string, dto: UpdateSalesTargetInput) { return this.salesOpsService.updateSalesTarget(tenantId, id, dto); }
  deleteSalesTarget(tenantId: string, id: string) { return this.salesOpsService.deleteSalesTarget(tenantId, id); }

  // ── SAVED REPORTS ─────────────────────────────
  getSavedReports(tenantId: string) { return this.marketingService.getSavedReports(tenantId); }
  createSavedReport(tenantId: string, dto: CreateSavedReportInput, createdBy: string) { return this.marketingService.createSavedReport(tenantId, dto, createdBy); }
  deleteSavedReport(tenantId: string, id: string) { return this.marketingService.deleteSavedReport(tenantId, id); }

  /** Cross-domain aggregator: resolve a saved report definition to live data. */
  async runSavedReport(tenantId: string, id: string) {
    const report = await this.marketingService.getSavedReportById(tenantId, id);
    switch (report.type) {
      case 'PIPELINE': return this.dealsService.getPipelineFunnel(tenantId);
      case 'LEADS': return this.dealsService.getLeadSourceBreakdown(tenantId);
      case 'REVENUE': return this.dealsService.getRevenueForecast(tenantId);
      case 'CONVERSION': return this.dealsService.getConversionFunnel(tenantId);
      case 'ACTIVITIES': return this.activitiesService.getActivities(tenantId);
      default: return this.dealsService.getPipelineFunnel(tenantId);
    }
  }

  // ── WORKFLOW RULES ────────────────────────────
  getWorkflowRules(tenantId: string) { return this.marketingService.getWorkflowRules(tenantId); }
  createWorkflowRule(tenantId: string, orgId: string, dto: CreateCrmWorkflowRuleInput, createdBy: string) { return this.marketingService.createWorkflowRule(tenantId, orgId, dto, createdBy); }
  updateWorkflowRule(tenantId: string, id: string, dto: UpdateCrmWorkflowRuleInput) { return this.marketingService.updateWorkflowRule(tenantId, id, dto); }
  toggleWorkflowRule(tenantId: string, id: string) { return this.marketingService.toggleWorkflowRule(tenantId, id); }
  deleteWorkflowRule(tenantId: string, id: string) { return this.marketingService.deleteWorkflowRule(tenantId, id); }

  // ── EMAIL SEQUENCES ───────────────────────────
  getEmailSequences(tenantId: string) { return this.marketingService.getEmailSequences(tenantId); }
  createEmailSequence(tenantId: string, orgId: string, dto: CreateEmailSequenceInput, createdBy: string) { return this.marketingService.createEmailSequence(tenantId, orgId, dto, createdBy); }
  enrollInSequence(tenantId: string, sequenceId: string, dto: EnrollSequenceInput) { return this.marketingService.enrollInSequence(tenantId, sequenceId, dto); }
  pauseEnrollment(tenantId: string, enrollmentId: string) { return this.marketingService.pauseEnrollment(tenantId, enrollmentId); }
  deleteEmailSequence(tenantId: string, id: string) { return this.marketingService.deleteEmailSequence(tenantId, id); }

  // ── TERRITORIES ───────────────────────────────
  getTerritories(tenantId: string) { return this.salesOpsService.getTerritories(tenantId); }
  createTerritory(tenantId: string, orgId: string, dto: CreateSalesTerritoryInput) { return this.salesOpsService.createTerritory(tenantId, orgId, dto); }
  updateTerritory(tenantId: string, id: string, dto: UpdateSalesTerritoryInput) { return this.salesOpsService.updateTerritory(tenantId, id, dto); }
  deleteTerritory(tenantId: string, id: string) { return this.salesOpsService.deleteTerritory(tenantId, id); }
  addTeamMember(tenantId: string, territoryId: string, dto: AddTeamMemberInput) { return this.salesOpsService.addTeamMember(tenantId, territoryId, dto); }
  removeTeamMember(tenantId: string, territoryId: string, userId: string) { return this.salesOpsService.removeTeamMember(tenantId, territoryId, userId); }
  getTerritoryPerformance(tenantId: string) { return this.salesOpsService.getTerritoryPerformance(tenantId); }

  // ── COMMISSIONS ───────────────────────────────
  getCommissionRules(tenantId: string) { return this.salesOpsService.getCommissionRules(tenantId); }
  createCommissionRule(tenantId: string, orgId: string, dto: CreateCommissionRuleInput) { return this.salesOpsService.createCommissionRule(tenantId, orgId, dto); }
  updateCommissionRule(tenantId: string, id: string, dto: UpdateCommissionRuleInput) { return this.salesOpsService.updateCommissionRule(tenantId, id, dto); }
  deleteCommissionRule(tenantId: string, id: string) { return this.salesOpsService.deleteCommissionRule(tenantId, id); }
  getCommissionEntries(tenantId: string, userId?: string) { return this.salesOpsService.getCommissionEntries(tenantId, userId); }
  calculateCommissions(tenantId: string, dto: CalculateCommissionsInput) { return this.salesOpsService.calculateCommissions(tenantId, dto); }

  // ── WEB-TO-LEAD FORMS ─────────────────────────
  getWebForms(tenantId: string) { return this.marketingService.getWebForms(tenantId); }
  createWebForm(tenantId: string, orgId: string, dto: CreateWebToLeadFormInput) { return this.marketingService.createWebForm(tenantId, orgId, dto); }
  updateWebForm(tenantId: string, id: string, dto: UpdateWebToLeadFormInput) { return this.marketingService.updateWebForm(tenantId, id, dto); }
  deleteWebForm(tenantId: string, id: string) { return this.marketingService.deleteWebForm(tenantId, id); }
  submitWebForm(formId: string, dto: SubmitWebFormInput) { return this.marketingService.submitWebForm(formId, dto); }
  getWebFormEmbed(tenantId: string, id: string) { return this.marketingService.getWebFormEmbed(tenantId, id); }

  // ── DOCUMENTS & IMPORT/EXPORT ─────────────────
  getCrmDocuments(tenantId: string, entityType?: string, entityId?: string) { return this.configService.getCrmDocuments(tenantId, entityType, entityId); }
  createCrmDocument(tenantId: string, orgId: string, dto: CreateCrmDocumentInput, uploadedBy: string) { return this.configService.createCrmDocument(tenantId, orgId, dto, uploadedBy); }
  deleteCrmDocument(tenantId: string, id: string) { return this.configService.deleteCrmDocument(tenantId, id); }
  importContacts(tenantId: string, orgId: string, rows: Array<Record<string, string>>) { return this.configService.importContacts(tenantId, orgId, rows); }
  exportContacts(tenantId: string) { return this.configService.exportContacts(tenantId); }
  importLeads(tenantId: string, orgId: string, rows: Array<Record<string, string>>) { return this.configService.importLeads(tenantId, orgId, rows); }
  exportLeads(tenantId: string) { return this.configService.exportLeads(tenantId); }

  // ── CUSTOM FIELDS & RECORD TYPES ──────────────
  getCustomFields(tenantId: string, entity?: string) { return this.configService.getCustomFields(tenantId, entity); }
  createCustomField(tenantId: string, orgId: string, dto: CreateCustomFieldInput, createdBy: string) { return this.configService.createCustomField(tenantId, orgId, dto, createdBy); }
  updateCustomField(tenantId: string, id: string, dto: UpdateCustomFieldInput) { return this.configService.updateCustomField(tenantId, id, dto); }
  deleteCustomField(tenantId: string, id: string) { return this.configService.deleteCustomField(tenantId, id); }
  getCustomFieldValues(tenantId: string, entityType: string, entityId: string) { return this.configService.getCustomFieldValues(tenantId, entityType, entityId); }
  upsertCustomFieldValues(tenantId: string, entityType: string, entityId: string, values: Array<{ fieldId: string; value: string | null }>) { return this.configService.upsertCustomFieldValues(tenantId, entityType, entityId, values); }
  getRecordTypes(tenantId: string, entity?: string) { return this.configService.getRecordTypes(tenantId, entity); }
  createRecordType(tenantId: string, orgId: string, dto: CreateRecordTypeInput) { return this.configService.createRecordType(tenantId, orgId, dto); }
  updateRecordType(tenantId: string, id: string, dto: UpdateRecordTypeInput) { return this.configService.updateRecordType(tenantId, id, dto); }
  deleteRecordType(tenantId: string, id: string) { return this.configService.deleteRecordType(tenantId, id); }

  // ── APPROVALS ─────────────────────────────────
  getApprovalProcesses(tenantId: string) { return this.configService.getApprovalProcesses(tenantId); }
  createApprovalProcess(tenantId: string, orgId: string, dto: CreateApprovalProcessInput, createdBy: string) { return this.configService.createApprovalProcess(tenantId, orgId, dto, createdBy); }
  updateApprovalProcess(tenantId: string, id: string, dto: UpdateApprovalProcessInput) { return this.configService.updateApprovalProcess(tenantId, id, dto); }
  deleteApprovalProcess(tenantId: string, id: string) { return this.configService.deleteApprovalProcess(tenantId, id); }
  submitForApproval(tenantId: string, userId: string, entityType: string, entityId: string, processId?: string) { return this.configService.submitForApproval(tenantId, userId, entityType, entityId, processId); }
  getPendingApprovals(tenantId: string, userId: string) { return this.configService.getPendingApprovals(tenantId, userId); }
  approveRequest(tenantId: string, requestId: string, userId: string, comments?: string) { return this.configService.approveRequest(tenantId, requestId, userId, comments); }
  rejectRequest(tenantId: string, requestId: string, userId: string, comments: string) { return this.configService.rejectRequest(tenantId, requestId, userId, comments); }
  recallRequest(tenantId: string, requestId: string, userId: string) { return this.configService.recallRequest(tenantId, requestId, userId); }
  getApprovalHistory(tenantId: string, entityType: string, entityId: string) { return this.configService.getApprovalHistory(tenantId, entityType, entityId); }

  // ── CPQ ───────────────────────────────────────
  getQuotationTemplates(tenantId: string) { return this.configService.getQuotationTemplates(tenantId); }
  createQuotationTemplate(tenantId: string, orgId: string, dto: CreateQuotationTemplateInput) { return this.configService.createQuotationTemplate(tenantId, orgId, dto); }
  updateQuotationTemplate(tenantId: string, id: string, dto: UpdateQuotationTemplateInput) { return this.configService.updateQuotationTemplate(tenantId, id, dto); }
  deleteQuotationTemplate(tenantId: string, id: string) { return this.configService.deleteQuotationTemplate(tenantId, id); }
  createQuotationVersion(tenantId: string, quotationId: string, userId: string, note?: string) { return this.configService.createQuotationVersion(tenantId, quotationId, userId, note); }
  getQuotationVersions(tenantId: string, quotationId: string) { return this.configService.getQuotationVersions(tenantId, quotationId); }
  cloneQuotation(tenantId: string, quotationId: string, userId: string) { return this.configService.cloneQuotation(tenantId, quotationId, userId); }
  sendForSignature(tenantId: string, quotationId: string, signerName: string, signerEmail: string) { return this.configService.sendForSignature(tenantId, quotationId, signerName, signerEmail); }
  getQuotationBySignToken(token: string) { return this.configService.getQuotationBySignToken(token); }
  submitSignature(token: string, signatureData: string, ipAddress: string) { return this.configService.submitSignature(token, signatureData, ipAddress); }

  // ── COLLABORATION ─────────────────────────────
  getComments(tenantId: string, entityType: string, entityId: string) { return this.collaborationService.getComments(tenantId, entityType, entityId); }
  createComment(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmCommentInput) { return this.collaborationService.createComment(tenantId, userId, entityType, entityId, dto); }
  updateComment(tenantId: string, id: string, userId: string, body: string) { return this.collaborationService.updateComment(tenantId, id, userId, body); }
  deleteComment(tenantId: string, id: string, userId: string) { return this.collaborationService.deleteComment(tenantId, id, userId); }
  togglePinComment(tenantId: string, id: string) { return this.collaborationService.togglePinComment(tenantId, id); }
  getFollowers(tenantId: string, entityType: string, entityId: string) { return this.collaborationService.getFollowers(tenantId, entityType, entityId); }
  followRecord(tenantId: string, userId: string, entityType: string, entityId: string) { return this.collaborationService.followRecord(tenantId, userId, entityType, entityId); }
  unfollowRecord(tenantId: string, userId: string, entityType: string, entityId: string) { return this.collaborationService.unfollowRecord(tenantId, userId, entityType, entityId); }
  getNotes(tenantId: string, entityType: string, entityId: string) { return this.collaborationService.getNotes(tenantId, entityType, entityId); }
  createNote(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmNoteInput) { return this.collaborationService.createNote(tenantId, userId, entityType, entityId, dto); }
  updateNote(tenantId: string, id: string, dto: UpdateCrmNoteInput) { return this.collaborationService.updateNote(tenantId, id, dto); }
  deleteNote(tenantId: string, id: string) { return this.collaborationService.deleteNote(tenantId, id); }
  togglePinNote(tenantId: string, id: string) { return this.collaborationService.togglePinNote(tenantId, id); }
  getUnifiedActivityFeed(tenantId: string, entityType: string, entityId: string) { return this.collaborationService.getUnifiedActivityFeed(tenantId, entityType, entityId); }

  // ── PLAYBOOKS, BATTLECARDS & CHECKLISTS ───────
  getPlaybooks(tenantId: string) { return this.dealsService.getPlaybooks(tenantId); }
  createPlaybook(tenantId: string, orgId: string, dto: CreatePlaybookInput, createdBy: string) { return this.dealsService.createPlaybook(tenantId, orgId, dto, createdBy); }
  updatePlaybook(tenantId: string, id: string, dto: UpdatePlaybookInput) { return this.dealsService.updatePlaybook(tenantId, id, dto); }
  deletePlaybook(tenantId: string, id: string) { return this.dealsService.deletePlaybook(tenantId, id); }
  getPlaybookStages(tenantId: string, playbookId: string) { return this.dealsService.getPlaybookStages(tenantId, playbookId); }
  upsertPlaybookStages(tenantId: string, playbookId: string, stages: Array<{ stageName: string; guidanceNotes?: string; checklist?: unknown[]; requiredFields?: string[]; talkingPoints?: string[]; exitCriteria?: unknown[]; sortOrder?: number }>) { return this.dealsService.upsertPlaybookStages(tenantId, playbookId, stages); }
  getBattlecards(tenantId: string) { return this.dealsService.getBattlecards(tenantId); }
  createBattlecard(tenantId: string, dto: CreateBattlecardInput, createdBy: string) { return this.dealsService.createBattlecard(tenantId, dto, createdBy); }
  updateBattlecard(tenantId: string, id: string, dto: UpdateBattlecardInput) { return this.dealsService.updateBattlecard(tenantId, id, dto); }
  deleteBattlecard(tenantId: string, id: string) { return this.dealsService.deleteBattlecard(tenantId, id); }
  getBattlecardByCompetitor(tenantId: string, competitor: string) { return this.dealsService.getBattlecardByCompetitor(tenantId, competitor); }
  getOpportunityChecklist(tenantId: string, opportunityId: string) { return this.dealsService.getOpportunityChecklist(tenantId, opportunityId); }
  toggleChecklistItem(tenantId: string, opportunityId: string, itemId: string, userId: string) { return this.dealsService.toggleChecklistItem(tenantId, opportunityId, itemId, userId); }
  validateStageAdvance(tenantId: string, opportunityId: string, targetStage: string) { return this.dealsService.validateStageAdvance(tenantId, opportunityId, targetStage); }

  // ── DASHBOARD BUILDER ─────────────────────────
  getDashboards(tenantId: string, userId: string) { return this.dashboardsService.getDashboards(tenantId, userId); }
  createDashboard(tenantId: string, orgId: string, userId: string, dto: CreateCrmDashboardInput) { return this.dashboardsService.createDashboard(tenantId, orgId, userId, dto); }
  updateDashboard(tenantId: string, id: string, dto: UpdateCrmDashboardInput) { return this.dashboardsService.updateDashboard(tenantId, id, dto); }
  deleteDashboard(tenantId: string, id: string) { return this.dashboardsService.deleteDashboard(tenantId, id); }
  cloneDashboard(tenantId: string, id: string, userId: string) { return this.dashboardsService.cloneDashboard(tenantId, id, userId); }
  addWidget(tenantId: string, dashboardId: string, dto: CreateDashboardWidgetInput) { return this.dashboardsService.addWidget(tenantId, dashboardId, dto); }
  updateWidget(tenantId: string, widgetId: string, dto: UpdateDashboardWidgetInput) { return this.dashboardsService.updateWidget(tenantId, widgetId, dto); }
  removeWidget(tenantId: string, widgetId: string) { return this.dashboardsService.removeWidget(tenantId, widgetId); }
  updateDashboardLayout(tenantId: string, dashboardId: string, layout: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>) { return this.dashboardsService.updateDashboardLayout(tenantId, dashboardId, layout); }

  /** Cross-domain aggregator: resolve a widget's configured data source to live data. */
  async getWidgetData(tenantId: string, widgetId: string) {
    const widget = await this.dashboardsService.getWidget(tenantId, widgetId);
    switch (widget.dataSource) {
      case 'PIPELINE': return this.dealsService.getPipelineFunnel(tenantId);
      case 'LEADS': return this.dealsService.getLeadSourceBreakdown(tenantId);
      case 'REVENUE': return this.dealsService.getRevenueForecast(tenantId);
      case 'TARGETS': return this.salesOpsService.getSalesTargets(tenantId);
      case 'CONVERSIONS': return this.dealsService.getConversionFunnel(tenantId);
      case 'COMMISSIONS': return this.salesOpsService.getCommissionEntries(tenantId);
      case 'ACTIVITIES': return this.activitiesService.getActivities(tenantId);
      default: return this.dealsService.getPipelineFunnel(tenantId);
    }
  }

  getAvailableMetrics() {
    return [
      { dataSource: 'PIPELINE', label: 'Pipeline Funnel', metrics: ['count', 'totalAmount'] },
      { dataSource: 'LEADS', label: 'Lead Sources', metrics: ['count'] },
      { dataSource: 'REVENUE', label: 'Revenue Forecast', metrics: ['totalAmount', 'weightedAmount'] },
      { dataSource: 'TARGETS', label: 'Sales Targets', metrics: ['target', 'achieved'] },
      { dataSource: 'CONVERSIONS', label: 'Conversion Funnel', metrics: ['leadToOppRate', 'oppToWinRate'] },
      { dataSource: 'COMMISSIONS', label: 'Commissions', metrics: ['amount'] },
      { dataSource: 'ACTIVITIES', label: 'Activities', metrics: ['count'] },
    ];
  }
}
