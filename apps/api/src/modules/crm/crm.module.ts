import { Module } from "@nestjs/common";
import { CrmController } from "./crm.controller";
import { CrmService } from "./crm.service";
import { CrmIntegrationsService } from "./crm-integrations.service";
import { CrmCustomersService } from "./crm-customers.service";
import { CrmContactsService } from "./crm-contacts.service";
import { CrmLeadsService } from "./crm-leads.service";
import { CrmDealsService } from "./crm-deals.service";
import { CrmActivitiesService } from "./crm-activities.service";
import { CrmMarketingService } from "./crm-marketing.service";
import { CrmSalesOpsService } from "./crm-salesops.service";
import { CrmConfigService } from "./crm-config.service";
import { CrmCollaborationService } from "./crm-collaboration.service";
import { CrmDashboardsService } from "./crm-dashboards.service";
import { CrmCasesService } from "./crm-cases.service";
import { CrmLeadScoringService } from "./crm-lead-scoring.service";
import { CrmLeadScoringController } from "./crm-lead-scoring.controller";
import { CrmDuplicatesService } from "./crm-duplicates.service";
import { CrmDuplicatesController } from "./crm-duplicates.controller";
import { CrmPipelineStagesService } from "./crm-pipeline-stages.service";
import { CrmPipelineStagesController } from "./crm-pipeline-stages.controller";
import { CrmSegmentsService } from "./crm-segments.service";
import { CrmSegmentsController } from "./crm-segments.controller";
import { CrmSlaService } from "./crm-sla.service";
import { CrmSlaController } from "./crm-sla.controller";
import { CrmIntelligenceService } from "./crm-intelligence.service";
import { CrmIntelligenceController } from "./crm-intelligence.controller";
import { CrmContractsService } from "./crm-contracts.service";
import { CrmContractsController } from "./crm-contracts.controller";
import { CrmMailboxService } from "./crm-mailbox.service";
import { CrmMailboxController } from "./crm-mailbox.controller";
import { CrmExpansionController } from "./crm-expansion.controller";
import { CustomerPortalService } from "./customer-portal.service";
import { CustomerPortalAdminController } from "./customer-portal-admin.controller";
import { CustomerPortalController } from "./customer-portal.controller";
import { CrmSettingsController } from "./settings.controller";
import { AppSettingsService } from "../../common/settings/settings.service";

import { CrmForecastingService } from "./crm-forecasting.service";
import { CrmAccountManagementService } from "./crm-account-management.service";
import { CrmCampaignManagementService } from "./crm-campaign-management.service";
import { CrmSupportService } from "./crm-support.service";
import { CrmEnablementService } from "./crm-enablement.service";
import { CrmRevOpsService } from "./crm-revops.service";
import { CrmPartnersService } from "./crm-partners.service";
import { CrmAutomationService } from "./crm-automation.service";
import { CrmTerritoryRulesService } from "./crm-territory-rules.service";
import { CrmTerritoryRulesController } from "./crm-territory-rules.controller";
import { CrmCadencesService } from "./crm-cadences.service";
import { CrmCadencesController } from "./crm-cadences.controller";
import { CrmQuoteSignatureService } from "./crm-quote-signature.service";
import {
  CrmQuoteSignatureController,
  CrmQuoteSignaturePublicController,
} from "./crm-quote-signature.controller";
import { CrmPipelineRiskService } from "./crm-pipeline-risk.service";
import { CrmPipelineRiskController } from "./crm-pipeline-risk.controller";
import { CrmPortalPaymentGatewayService } from "./crm-portal-payment-gateway.service";
import { CrmPortalDocumentsService } from "./crm-portal-documents.service";
import { CrmRevenueIntelligenceService } from "./crm-revenue-intelligence.service";
import { CrmRevenueIntelligenceController } from "./crm-revenue-intelligence.controller";
import { CrmConversationIntelligenceService } from "./crm-conversation-intelligence.service";
import { CrmConversationIntelligenceController } from "./crm-conversation-intelligence.controller";
import { CrmConversionAnalyticsService } from "./crm-conversion-analytics.service";
import { CrmConversionAnalyticsController } from "./crm-conversion-analytics.controller";
import { CrmAiDraftingService } from "./crm-ai-drafting.service";
import { CrmAiDraftingController } from "./crm-ai-drafting.controller";
import { CrmGamificationService } from "./crm-gamification.service";
import { CrmGamificationController } from "./crm-gamification.controller";
import { CrmCommissionAutomationService } from "./crm-commission-automation.service";
import { CrmCommissionAutomationController } from "./crm-commission-automation.controller";
import { CrmCoachingService } from "./crm-coaching.service";
import { CrmCoachingController } from "./crm-coaching.controller";
import { CrmDealRoomService } from "./crm-deal-room.service";
import {
  CrmDealRoomController,
  CrmDealRoomPublicController,
} from "./crm-deal-room.controller";
import { CrmSalesAutomationService } from "./crm-sales-automation.service";
import { CrmCustomerSuccessService } from "./crm-customer-success.service";
import { CrmMarketingAutomationService } from "./crm-marketing-automation.service";
import { CrmDeepController } from "./crm-deep.controller";
import { CrmExpansionDeepController } from "./crm-expansion-deep.controller";

import { CrmLeadEnrichmentService } from "./crm-lead-enrichment.service";
import {
  CrmLeadEnrichmentSourceController,
  CrmLeadEnrichmentRuleController,
  CrmLeadEnrichmentFieldMappingController,
  CrmLeadEnrichmentExecutionController,
  CrmLeadEnrichmentScheduleController,
  CrmLeadEnrichmentAnalyticsController,
} from "./crm-lead-enrichment.controller";
import { CrmGuidedSellingService } from "./crm-guided-selling.service";
import {
  CrmNextBestActionConfigController,
  CrmGuidedSellingSuggestionController,
  CrmGuidedSellingPlaybookController,
  CrmGuidedSellingDealReadinessController,
  CrmGuidedSellingAnalyticsController,
} from "./crm-guided-selling.controller";
import { CrmContractLifecycleService } from "./crm-contract-lifecycle.service";
import {
  CrmContractAmendmentController,
  CrmContractPriceEscalationController,
  CrmContractAutoRenewalController,
  CrmContractExpirationPipelineController,
  CrmContractTemplateController,
  CrmContractClauseController,
  CrmContractLifecycleAnalyticsController,
} from "./crm-contract-lifecycle.controller";

import { CrmCommunicationService } from "./crm-communication.service";
import {
  CrmCommunicationChannelController,
  CrmCommunicationTemplateController,
  CrmCommunicationLogController,
} from "./crm-communication.controller";
import { CrmKnowledgeBaseService } from "./crm-knowledge-base.service";
import {
  CrmKnowledgeBaseCategoryController,
  CrmKnowledgeBaseArticleController,
} from "./crm-knowledge-base.controller";
import { CrmPartnerDeepService } from "./crm-partner-deep.service";
import {
  CrmPartnerDealRegistrationController,
  CrmPartnerMdfController,
} from "./crm-partner-deep.controller";
import { CrmWinLossService } from "./crm-win-loss.service";
import { CrmWinLossController } from "./crm-win-loss.controller";

const CRM_SERVICES = [
  CrmService,
  CrmIntelligenceService,
  CrmIntegrationsService,
  CrmCustomersService,
  CrmContactsService,
  CrmLeadsService,
  CrmDealsService,
  CrmActivitiesService,
  CrmMarketingService,
  CrmSalesOpsService,
  CrmConfigService,
  CrmCollaborationService,
  CrmDashboardsService,
  CrmCasesService,
  CrmLeadScoringService,
  CrmDuplicatesService,
  CrmPipelineStagesService,
  CrmSegmentsService,
  CrmSlaService,
  CrmContractsService,
  CrmMailboxService,
  CrmForecastingService,
  CrmAccountManagementService,
  CrmCampaignManagementService,
  CrmSupportService,
  CrmEnablementService,
  CrmRevOpsService,
  CrmPartnersService,
  CrmAutomationService,
  CustomerPortalService,
  CrmTerritoryRulesService,
  CrmCadencesService,
  CrmQuoteSignatureService,
  CrmPipelineRiskService,
  CrmPortalPaymentGatewayService,
  CrmPortalDocumentsService,
  CrmRevenueIntelligenceService,
  CrmConversationIntelligenceService,
  CrmConversionAnalyticsService,
  CrmAiDraftingService,
  CrmGamificationService,
  CrmCommissionAutomationService,
  CrmCoachingService,
  CrmDealRoomService,
  CrmSalesAutomationService,
  CrmCustomerSuccessService,
  CrmMarketingAutomationService,
  CrmLeadEnrichmentService,
  CrmGuidedSellingService,
  CrmContractLifecycleService,
  CrmCommunicationService,
  CrmKnowledgeBaseService,
  CrmPartnerDeepService,
  CrmWinLossService,
  AppSettingsService,
];

@Module({
  controllers: [
    CrmController,
    CrmIntelligenceController,
    CrmLeadScoringController,
    CrmDuplicatesController,
    CrmPipelineStagesController,
    CrmSegmentsController,
    CrmSlaController,
    CrmContractsController,
    CrmMailboxController,
    CrmExpansionController,
    CustomerPortalAdminController,
    CustomerPortalController,
    CrmTerritoryRulesController,
    CrmCadencesController,
    CrmQuoteSignatureController,
    CrmQuoteSignaturePublicController,
    CrmPipelineRiskController,
    CrmRevenueIntelligenceController,
    CrmConversationIntelligenceController,
    CrmConversionAnalyticsController,
    CrmAiDraftingController,
    CrmGamificationController,
    CrmCommissionAutomationController,
    CrmCoachingController,
    CrmDealRoomController,
    CrmDealRoomPublicController,
    CrmDeepController,
    CrmExpansionDeepController,
    CrmLeadEnrichmentSourceController,
    CrmLeadEnrichmentRuleController,
    CrmLeadEnrichmentFieldMappingController,
    CrmLeadEnrichmentExecutionController,
    CrmLeadEnrichmentScheduleController,
    CrmLeadEnrichmentAnalyticsController,
    CrmNextBestActionConfigController,
    CrmGuidedSellingSuggestionController,
    CrmGuidedSellingPlaybookController,
    CrmGuidedSellingDealReadinessController,
    CrmGuidedSellingAnalyticsController,
    CrmContractAmendmentController,
    CrmContractPriceEscalationController,
    CrmContractAutoRenewalController,
    CrmContractExpirationPipelineController,
    CrmContractTemplateController,
    CrmContractClauseController,
    CrmContractLifecycleAnalyticsController,
    CrmCommunicationChannelController,
    CrmCommunicationTemplateController,
    CrmCommunicationLogController,
    CrmKnowledgeBaseCategoryController,
    CrmKnowledgeBaseArticleController,
    CrmPartnerDealRegistrationController,
    CrmPartnerMdfController,
    CrmWinLossController,
    CrmSettingsController,
  ],
  providers: CRM_SERVICES,
  exports: CRM_SERVICES,
})
export class CrmModule {}
