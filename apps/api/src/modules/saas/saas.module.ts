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

@Module({
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
  ],
  providers: [
    SaasService,
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
  ],
  exports: [
    SaasService,
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
  ],
})
export class SaasModule {}
