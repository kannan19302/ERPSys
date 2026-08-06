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
import { CrmEnterpriseModule } from "./crm-enterprise.module";
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
import { CrmCpqService } from "./crm-cpq.service";
import { CrmCpqController } from "./crm-cpq.controller";
import { AppSettingsService } from "../../common/settings/settings.service";
import { CrmExpansionV1Service } from "./crm-expansion-v1.service";
import { CrmExpansionV1Controller } from "./crm-expansion-v1.controller";

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

import { CrmExpansionDeepController } from "./crm-expansion-deep.controller";
import { CrmActivityCaptureService } from "./crm-activity-capture.service";
import { CrmActivityCaptureController } from "./crm-activity-capture.controller";
import { CrmMarketingDeepService } from "./crm-marketing-deep.service";
import { CrmMarketingDeepController } from "./crm-marketing-deep.controller";

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
import { CrmPartnerDeepTwoService } from "./crm-partner-deep-two.service";
import { CrmPartnerDeepTwoController } from "./crm-partner-deep-two.controller";
import { CrmIntegrationDeepService } from "./crm-integration-deep.service";
import { CrmIntegrationDeepController } from "./crm-integration-deep.controller";
import { CrmPipelineDeepService } from "./crm-pipeline-deep.service";
import { CrmPipelineDeepController } from "./crm-pipeline-deep.controller";
import { CrmAbmOrchestrationService } from "./crm-abm-orchestration.service";
import { CrmAbmOrchestrationController } from "./crm-abm-orchestration.controller";
import { CrmChannelPortalDeepService } from "./crm-channel-portal-deep.service";
import { CrmWinLossService } from "./crm-win-loss.service";
import { CrmWinLossController } from "./crm-win-loss.controller";
import { CrmForecastGovernanceService } from "./crm-forecast-governance.service";
import { CrmDealDeskService } from "./crm-deal-desk.service";
import { CrmDealDeskController } from "./crm-deal-desk.controller";
import { CrmSupportDeepController } from "./crm-support-deep.controller";
import { CrmPortalDeepController } from "./crm-portal-deep.controller";
import { CrmCustomerJourneyService } from "./crm-customer-journey.service";
import { CrmCustomerJourneyController } from "./crm-customer-journey.controller";
import { CrmSupportDeepService } from "./crm-support-deep.service";
import { CrmPortalDeepService } from "./crm-portal-deep.service";
import { CrmContentManagementService } from "./crm-content-management.service";
import { CrmContentManagementController } from "./crm-content-management.controller";
import { CrmDataManagementService } from "./crm-data-management.service";
import { CrmDataManagementController } from "./crm-data-management.controller";
import { CrmTerritoryDeepService } from "./crm-territory-deep.service";
import { CrmReportingDeepService } from "./crm-reporting-deep.service";
import { CrmTerritoryDeepController } from "./crm-territory-deep.controller";
import { CrmReportingDeepController } from "./crm-reporting-deep.controller";
import { CrmAiIntelligenceService } from "./crm-ai-intelligence.service";
import { CrmAiIntelligenceController } from "./crm-ai-intelligence.controller";
import { CrmCompetitorIntelligenceService } from "./crm-competitor-intelligence.service";
import { CrmCompetitorIntelligenceController } from "./crm-competitor-intelligence.controller";
import { CrmCommunicationDeepService } from "./crm-communication-deep.service";
import { CrmCommunicationDeepController } from "./crm-communication-deep.controller";
import { CrmContractDeepService } from "./crm-contract-deep.service";
import { CrmContractDeepController } from "./crm-contract-deep.controller";
import { CrmGamificationDeepService } from "./crm-gamification-deep.service";
import { CrmGamificationDeepController } from "./crm-gamification-deep.controller";
import { CrmCoachingDeepService } from "./crm-coaching-deep.service";
import { CrmCoachingDeepController } from "./crm-coaching-deep.controller";
import { CrmCustomerSuccessDeepService } from "./services/crm-customer-success-deep.service";
import { CrmCustomerSuccessDeepController } from "./crm-customer-success-deep.controller";
import { CrmAccountHierarchiesDeepService } from "./crm-account-hierarchies-deep.service";
import { CrmAccountHierarchiesDeepController } from "./crm-account-hierarchies-deep.controller";
import { CrmDealAnalyticsDeepService } from "./crm-deal-analytics-deep.service";
import { CrmDealAnalyticsDeepController } from "./crm-deal-analytics-deep.controller";
import { CrmAccountIntelligenceDeepService } from "./crm-account-intelligence-deep.service";
import { CrmAccountIntelligenceDeepController } from "./crm-account-intelligence-deep.controller";
import { CrmMarketingRoiDeepService } from "./crm-marketing-roi-deep.service";
import { CrmMarketingRoiDeepController } from "./crm-marketing-roi-deep.controller";
import { CrmCustomerLifecycleDeepService } from "./crm-customer-lifecycle-deep.service";
import { CrmCustomerLifecycleDeepController } from "./crm-customer-lifecycle-deep.controller";
import { CrmSalesOperationsDeepService } from "./crm-sales-operations-deep.service";
import { CrmSalesOperationsDeepController } from "./crm-sales-operations-deep.controller";
import { CrmRevenueOptimizationDeepService } from "./crm-revenue-optimization-deep.service";
import { CrmRevenueOptimizationDeepController } from "./crm-revenue-optimization-deep.controller";
import { CrmCustomerExperienceDeepService } from "./crm-customer-experience-deep.service";
import { CrmCustomerExperienceDeepController } from "./crm-customer-experience-deep.controller";
import {
  CrmRelationshipsDeepController,
  CrmPipelineOpsController,
  CrmSalesForecastingDeepController,
  CrmSalesAnalyticsExpansionController,
} from "./crm-deep-expansion-v2.controller";

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
  CrmCustomerJourneyService,
  AppSettingsService,
  CrmExpansionV1Service,
  CrmActivityCaptureService,
  CrmMarketingDeepService,
  CrmCpqService,
  CrmSupportDeepService,
  CrmPortalDeepService,
  CrmForecastGovernanceService,
  CrmDealDeskService,
  CrmContentManagementService,
  CrmDataManagementService,
  CrmTerritoryDeepService,
  CrmReportingDeepService,
  CrmPartnerDeepTwoService,
  CrmIntegrationDeepService,
  CrmPipelineDeepService,
  CrmAbmOrchestrationService,
  CrmChannelPortalDeepService,
  CrmAiIntelligenceService,
  CrmCompetitorIntelligenceService,
  CrmGamificationDeepService,
  CrmCoachingDeepService,
  CrmCommunicationDeepService,
  CrmContractDeepService,
  CrmCustomerSuccessDeepService,
  CrmAccountHierarchiesDeepService,
  CrmDealAnalyticsDeepService,
  CrmAccountIntelligenceDeepService,
  CrmMarketingRoiDeepService,
  CrmCustomerLifecycleDeepService,
  CrmSalesOperationsDeepService,
  CrmRevenueOptimizationDeepService,
  CrmCustomerExperienceDeepService,
];

@Module({
  imports: [CrmEnterpriseModule],
  controllers: [
    CrmController,
    CrmExpansionV1Controller,

    CrmDealDeskController,
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

    CrmExpansionDeepController,
    CrmActivityCaptureController,
    CrmMarketingDeepController,
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
    CrmCustomerJourneyController,
    CrmCpqController,
    CrmSupportDeepController,
    CrmPortalDeepController,
    CrmContentManagementController,
    CrmDataManagementController,
    CrmTerritoryDeepController,
    CrmReportingDeepController,
    CrmPartnerDeepTwoController,
    CrmIntegrationDeepController,
    CrmPipelineDeepController,
    CrmAbmOrchestrationController,
    CrmSettingsController,
    CrmAiIntelligenceController,
    CrmCompetitorIntelligenceController,
    CrmGamificationDeepController,
    CrmCoachingDeepController,
    CrmCommunicationDeepController,
    CrmContractDeepController,
    CrmCustomerSuccessDeepController,
    CrmAccountHierarchiesDeepController,
    CrmDealAnalyticsDeepController,
    CrmAccountIntelligenceDeepController,
    CrmMarketingRoiDeepController,
    CrmCustomerLifecycleDeepController,
    CrmSalesOperationsDeepController,
    CrmRevenueOptimizationDeepController,
    CrmCustomerExperienceDeepController,
    CrmRelationshipsDeepController,
    CrmPipelineOpsController,
    CrmSalesForecastingDeepController,
    CrmSalesAnalyticsExpansionController,
  ],
  providers: CRM_SERVICES,
  exports: CRM_SERVICES,
})
export class CrmModule {}
