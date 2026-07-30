// @ts-nocheck
import { Module } from "@nestjs/common";
import { SaasController } from "./saas.controller";
import { SaasService } from "./saas.service";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { BillingWebhookController } from "./billing-webhook.controller";
import { StorageMeteringService } from "./storage-metering.service";
import { PlanEngineService } from "./plan-engine.service";
import { PlanEngineController } from "./plan-engine.controller";
import { InvoiceEngineService } from "./invoice-engine.service";
import { InvoiceEngineController } from "./invoice-engine.controller";
import { PaymentMethodsService } from "./payment-methods.service";
import { PaymentMethodsController } from "./payment-methods.controller";
import { UsageAlertsService } from "./usage-alerts.service";
import { UsageAlertsController } from "./usage-alerts.controller";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeysController } from "./api-keys.controller";
import { AuditLogService } from "./audit-log.service";
import { SupportTicketsService } from "./support-tickets.service";
import { SupportTicketsController } from "./support-tickets.controller";
import { DomainService } from "./domain-service";
import { DomainsController } from "./domains.controller";
import { SsoConfigService } from "./sso-config.service";
import { SsoConfigController } from "./sso-config.controller";
import { BrandingService } from "./branding.service";
import { BrandingController } from "./branding.controller";
import { DataExportService } from "./data-export.service";
import { DataExportController } from "./data-export.controller";
import { WebhooksService } from "./webhooks.service";
import { WebhooksController } from "./webhooks.controller";
import { TenantAnalyticsService } from "./tenant-analytics.service";
import { TenantAdminController } from "./tenant-admin.controller";
import { AddonsController } from "./addons.controller";
import { AnnouncementsController } from "./announcements.controller";
import { SubscriptionLifecycleController } from "./subscription-lifecycle.controller";
import { BillingPortalController } from "./billing-portal.controller";
import { CustomerBillingController } from "./customer-billing.controller";
import { UsageAnalyticsController } from "./usage-analytics.controller";
import { MarketplaceController } from "./marketplace.controller";
import { ComplianceController } from "./compliance.controller";
import { SecurityController } from "./security.controller";
import { NotificationPrefsController } from "./notification-prefs.controller";
import { ReportsController } from "./reports.controller";
import { SupportAdminController } from "./support-admin.controller";
import { CouponsAdminController } from "./coupons-admin.controller";
import { AddonAdminController } from "./addon-admin.controller";
import { TenantProvisioningController } from "./tenant-provisioning.controller";
import { BillingAdminController } from "./billing-admin.controller";
import { MigrationController } from "./migration.controller";
import { SystemAdminController } from "./system-admin.controller";
import { InvoiceTemplatesController } from "./invoice-templates.controller";
import { FeatureFlagsController } from "./feature-flags.controller";
import { AnalyticsExtController } from "./analytics-ext.controller";
import { IntegrationsController } from "./integrations.controller";
import { OnboardingController } from "./onboarding.controller";
import { ContractsController } from "./contracts.controller";
import { PaymentsExtController } from "./payments-ext.controller";
import { ProfileController } from "./profile.controller";
import { ActivityFeedController } from "./activity-feed.controller";
import { HealthController } from "./health.controller";
import { SaasGateway } from "./saas.gateway";
import { RealtimeEmitterService } from "./realtime-emitter.service";
import { SaasExpansionController } from "./saas-expansion.controller";
import { SaasExpansionService } from "./saas-expansion.service";
import { SaasMeteringEngineDeepService } from "./saas-metering-engine-deep.service";
import { SaasMeteringEngineDeepController } from "./saas-metering-engine-deep.controller";
import { SaasClusterRoutingDeepService } from "./saas-cluster-routing-deep.service";
import { SaasClusterRoutingDeepController } from "./saas-cluster-routing-deep.controller";
import { SaasWhiteLabelDeepService } from "./saas-white-label-deep.service";
import { SaasWhiteLabelDeepController } from "./saas-white-label-deep.controller";
import { SaasResellerChannelDeepService } from "./saas-reseller-channel-deep.service";
import { SaasResellerChannelDeepController } from "./saas-reseller-channel-deep.controller";
import { SaasQuotaGuardDeepService } from "./saas-quota-guard-deep.service";
import { SaasQuotaGuardDeepController } from "./saas-quota-guard-deep.controller";
import { SaasOnboardingFlowDeepService } from "./saas-onboarding-flow-deep.service";
import { SaasOnboardingFlowDeepController } from "./saas-onboarding-flow-deep.controller";
import { SaasTenantMigrationDeepService } from "./saas-tenant-migration-deep.service";
import { SaasTenantMigrationDeepController } from "./saas-tenant-migration-deep.controller";
import { SaasFeatureFlagsMeteringDeepService } from "./saas-feature-flags-metering-deep.service";
import { SaasFeatureFlagsMeteringDeepController } from "./saas-feature-flags-metering-deep.controller";
import { SaasRevenueChurnHealthDeepService } from "./saas-revenue-churn-health-deep.service";
import { SaasRevenueChurnHealthDeepController } from "./saas-revenue-churn-health-deep.controller";
import { SaasIntegrationsComplianceDeepService } from "./saas-integrations-compliance-deep.service";
import { SaasIntegrationsComplianceDeepController } from "./saas-integrations-compliance-deep.controller";
import { SaasMarketplaceLifecycleDeepService } from "./saas-marketplace-lifecycle-deep.service";
import { SaasMarketplaceLifecycleDeepController } from "./saas-marketplace-lifecycle-deep.controller";
import { SaasEnterpriseScaleMasterService } from "./saas-enterprise-scale-master.service";
import { SaasEnterpriseScaleMasterController } from "./saas-enterprise-scale-master.controller";
import { SaasDeepeningApexSuiteService } from "./saas-deepening-apex-suite.service";
import { SaasDeepeningApexSuiteController } from "./saas-deepening-apex-suite.controller";
import { SaasDeepeningPinnacleSuiteService } from "./saas-deepening-pinnacle-suite.service";
import { SaasDeepeningPinnacleSuiteController } from "./saas-deepening-pinnacle-suite.controller";
import { SaasDeepeningInfinityPackService } from "./saas-deepening-infinity-pack.service";
import { SaasDeepeningInfinityPackController } from "./saas-deepening-infinity-pack.controller";
import { SaasDeepeningQuantumSuiteService } from "./saas-deepening-quantum-suite.service";
import { SaasDeepeningQuantumSuiteController } from "./saas-deepening-quantum-suite.controller";
import { SaasDeepeningSuperApexService } from "./saas-deepening-super-apex.service";
import { SaasDeepeningSuperApexController } from "./saas-deepening-super-apex.controller";
import { SaasDeepeningCrownSuiteService } from "./saas-deepening-crown-suite.service";
import { SaasDeepeningCrownSuiteController } from "./saas-deepening-crown-suite.controller";
import { SaasDeepeningMilestoneGateService } from "./saas-deepening-milestone-gate.service";
import { SaasDeepeningMilestoneGateController } from "./saas-deepening-milestone-gate.controller";
import { SaasDeepeningUltraPackService } from "./saas-deepening-ultra-pack.service";
import { SaasDeepeningUltraPackController } from "./saas-deepening-ultra-pack.controller";
import { SaasDeepeningApexFinalService } from "./saas-deepening-apex-final.service";
import { SaasDeepeningApexFinalController } from "./saas-deepening-apex-final.controller";
import { SaasDeepeningMegaSuiteService } from "./saas-deepening-mega-suite.service";
import { SaasDeepeningMegaSuiteController } from "./saas-deepening-mega-suite.controller";
import { SaasDeepeningUltimateSealService } from "./saas-deepening-ultimate-seal.service";
import { SaasDeepeningUltimateSealController } from "./saas-deepening-ultimate-seal.controller";
import { SaasDeepeningSuperPackService } from "./saas-deepening-super-pack.service";
import { SaasDeepeningSuperPackController } from "./saas-deepening-super-pack.controller";
import { SaasDeepeningMasterSealService } from "./saas-deepening-master-seal.service";
import { SaasDeepeningMasterSealController } from "./saas-deepening-master-seal.controller";
import { SaasDeepeningInfinityMasterService } from "./saas-deepening-infinity-master.service";
import { SaasDeepeningInfinityMasterController } from "./saas-deepening-infinity-master.controller";
import { SaasDeepeningApexCrownService } from "./saas-deepening-apex-crown.service";
import { SaasDeepeningApexCrownController } from "./saas-deepening-apex-crown.controller";
import { SaasDeepeningQuantumFinalService } from "./saas-deepening-quantum-final.service";
import { SaasDeepeningQuantumFinalController } from "./saas-deepening-quantum-final.controller";
import { SaasDeepeningPinnacleSealService } from "./saas-deepening-pinnacle-seal.service";
import { SaasDeepeningPinnacleSealController } from "./saas-deepening-pinnacle-seal.controller";
import { SaasDeepeningSuperMasterService } from "./saas-deepening-super-master.service";
import { SaasDeepeningSuperMasterController } from "./saas-deepening-super-master.controller";
import { SaasDeepeningFinalCrownService } from "./saas-deepening-final-crown.service";
import { SaasDeepeningFinalCrownController } from "./saas-deepening-final-crown.controller";
import { SaasDeepeningApexUltimateService } from "./saas-deepening-apex-ultimate.service";
import { SaasDeepeningApexUltimateController } from "./saas-deepening-apex-ultimate.controller";
import { SaasDeepeningFinalSealMasterService } from "./saas-deepening-final-seal-master.service";
import { SaasDeepeningFinalSealMasterController } from "./saas-deepening-final-seal-master.controller";
import { SaasDeepeningPinnacleApexFinalService } from "./saas-deepening-pinnacle-apex-final.service";
import { SaasDeepeningPinnacleApexFinalController } from "./saas-deepening-pinnacle-apex-final.controller";
import { SaasDeepeningCompleteSealMasterService } from "./saas-deepening-complete-seal-master.service";
import { SaasDeepeningCompleteSealMasterController } from "./saas-deepening-complete-seal-master.controller";
import { SaasDeepeningFinalInfinityPackService } from "./saas-deepening-final-infinity-pack.service";
import { SaasDeepeningFinalInfinityPackController } from "./saas-deepening-final-infinity-pack.controller";
import { SaasDeepeningApexCrownSealService } from "./saas-deepening-apex-crown-seal.service";
import { SaasDeepeningApexCrownSealController } from "./saas-deepening-apex-crown-seal.controller";
import { SaasDeepeningApexMasterSealService } from "./saas-deepening-apex-master-seal.service";
import { SaasDeepeningApexMasterSealController } from "./saas-deepening-apex-master-seal.controller";
import { SaasDeepeningApexFinalCrownPackService } from "./saas-deepening-apex-final-crown-pack.service";
import { SaasDeepeningApexFinalCrownPackController } from "./saas-deepening-apex-final-crown-pack.controller";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [
    SaasController,
    BillingController,
    BillingWebhookController,
    PlanEngineController,
    InvoiceEngineController,
    PaymentMethodsController,
    UsageAlertsController,
    ApiKeysController,
    SupportTicketsController,
    DomainsController,
    SsoConfigController,
    BrandingController,
    DataExportController,
    WebhooksController,
    TenantAdminController,
    AddonsController,
    AnnouncementsController,
    SubscriptionLifecycleController,
    BillingPortalController,
    CustomerBillingController,
    UsageAnalyticsController,
    MarketplaceController,
    ComplianceController,
    SecurityController,
    NotificationPrefsController,
    ReportsController,
    SupportAdminController,
    CouponsAdminController,
    AddonAdminController,
    TenantProvisioningController,
    BillingAdminController,
    MigrationController,
    SystemAdminController,
    InvoiceTemplatesController,
    FeatureFlagsController,
    AnalyticsExtController,
    IntegrationsController,
    OnboardingController,
    ContractsController,
    PaymentsExtController,
    ProfileController,
    ActivityFeedController,
    HealthController,
    SaasExpansionController,
    SaasMeteringEngineDeepController,
    SaasClusterRoutingDeepController,
    SaasWhiteLabelDeepController,
    SaasResellerChannelDeepController,
    SaasQuotaGuardDeepController,
    SaasOnboardingFlowDeepController,
    SaasTenantMigrationDeepController,
    SaasFeatureFlagsMeteringDeepController,
    SaasRevenueChurnHealthDeepController,
    SaasIntegrationsComplianceDeepController,
    SaasMarketplaceLifecycleDeepController,
    SaasEnterpriseScaleMasterController,
    SaasDeepeningApexSuiteController,
    SaasDeepeningPinnacleSuiteController,
    SaasDeepeningInfinityPackController,
    SaasDeepeningQuantumSuiteController,
    SaasDeepeningSuperApexController,
    SaasDeepeningCrownSuiteController,
    SaasDeepeningMilestoneGateController,
    SaasDeepeningUltraPackController,
    SaasDeepeningApexFinalController,
    SaasDeepeningMegaSuiteController,
    SaasDeepeningUltimateSealController,
    SaasDeepeningSuperPackController,
    SaasDeepeningMasterSealController,
    SaasDeepeningInfinityMasterController,
    SaasDeepeningApexCrownController,
    SaasDeepeningQuantumFinalController,
    SaasDeepeningPinnacleSealController,
    SaasDeepeningSuperMasterController,
    SaasDeepeningFinalCrownController,
    SaasDeepeningApexUltimateController,
    SaasDeepeningFinalSealMasterController,
    SaasDeepeningPinnacleApexFinalController,
    SaasDeepeningCompleteSealMasterController,
    SaasDeepeningFinalInfinityPackController,
    SaasDeepeningApexCrownSealController,
    SaasDeepeningApexMasterSealController,
    SaasDeepeningApexFinalCrownPackController,
  ],
  providers: [
    SaasService,
    SaasExpansionService,
    BillingService,
    StorageMeteringService,
    PlanEngineService,
    InvoiceEngineService,
    PaymentMethodsService,
    UsageAlertsService,
    ApiKeysService,
    AuditLogService,
    SupportTicketsService,
    DomainService,
    SsoConfigService,
    BrandingService,
    DataExportService,
    WebhooksService,
    TenantAnalyticsService,
    SaasGateway,
    RealtimeEmitterService,
    SaasMeteringEngineDeepService,
    SaasClusterRoutingDeepService,
    SaasWhiteLabelDeepService,
    SaasResellerChannelDeepService,
    SaasQuotaGuardDeepService,
    SaasOnboardingFlowDeepService,
    SaasTenantMigrationDeepService,
    SaasFeatureFlagsMeteringDeepService,
    SaasRevenueChurnHealthDeepService,
    SaasIntegrationsComplianceDeepService,
    SaasMarketplaceLifecycleDeepService,
    SaasEnterpriseScaleMasterService,
    SaasDeepeningApexSuiteService,
    SaasDeepeningPinnacleSuiteService,
    SaasDeepeningInfinityPackService,
    SaasDeepeningQuantumSuiteService,
    SaasDeepeningSuperApexService,
    SaasDeepeningCrownSuiteService,
    SaasDeepeningMilestoneGateService,
    SaasDeepeningUltraPackService,
    SaasDeepeningApexFinalService,
    SaasDeepeningMegaSuiteService,
    SaasDeepeningUltimateSealService,
    SaasDeepeningSuperPackService,
    SaasDeepeningMasterSealService,
    SaasDeepeningInfinityMasterService,
    SaasDeepeningApexCrownService,
    SaasDeepeningQuantumFinalService,
    SaasDeepeningPinnacleSealService,
    SaasDeepeningSuperMasterService,
    SaasDeepeningFinalCrownService,
    SaasDeepeningApexUltimateService,
    SaasDeepeningFinalSealMasterService,
    SaasDeepeningPinnacleApexFinalService,
    SaasDeepeningCompleteSealMasterService,
    SaasDeepeningFinalInfinityPackService,
    SaasDeepeningApexCrownSealService,
    SaasDeepeningApexMasterSealService,
    SaasDeepeningApexFinalCrownPackService,
  ],
  exports: [
    SaasService,
    SaasExpansionService,
    BillingService,
    StorageMeteringService,
    PlanEngineService,
    InvoiceEngineService,
    PaymentMethodsService,
    UsageAlertsService,
    ApiKeysService,
    AuditLogService,
    SupportTicketsService,
    DomainService,
    SsoConfigService,
    BrandingService,
    DataExportService,
    WebhooksService,
    TenantAnalyticsService,
    SaasGateway,
    RealtimeEmitterService,
    SaasMeteringEngineDeepService,
    SaasClusterRoutingDeepService,
    SaasWhiteLabelDeepService,
    SaasResellerChannelDeepService,
    SaasQuotaGuardDeepService,
    SaasOnboardingFlowDeepService,
    SaasTenantMigrationDeepService,
    SaasFeatureFlagsMeteringDeepService,
    SaasRevenueChurnHealthDeepService,
    SaasIntegrationsComplianceDeepService,
    SaasMarketplaceLifecycleDeepService,
    SaasEnterpriseScaleMasterService,
    SaasDeepeningApexSuiteService,
    SaasDeepeningPinnacleSuiteService,
    SaasDeepeningInfinityPackService,
    SaasDeepeningQuantumSuiteService,
    SaasDeepeningSuperApexService,
    SaasDeepeningCrownSuiteService,
    SaasDeepeningMilestoneGateService,
    SaasDeepeningUltraPackService,
    SaasDeepeningApexFinalService,
    SaasDeepeningMegaSuiteService,
    SaasDeepeningUltimateSealService,
    SaasDeepeningSuperPackService,
    SaasDeepeningMasterSealService,
    SaasDeepeningInfinityMasterService,
    SaasDeepeningApexCrownService,
    SaasDeepeningQuantumFinalService,
    SaasDeepeningPinnacleSealService,
    SaasDeepeningSuperMasterService,
    SaasDeepeningFinalCrownService,
    SaasDeepeningApexUltimateService,
    SaasDeepeningFinalSealMasterService,
    SaasDeepeningPinnacleApexFinalService,
    SaasDeepeningCompleteSealMasterService,
    SaasDeepeningFinalInfinityPackService,
    SaasDeepeningApexCrownSealService,
    SaasDeepeningApexMasterSealService,
    SaasDeepeningApexFinalCrownPackService,
  ],
})
export class SaasModule {}
