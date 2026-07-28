import { Module } from "@nestjs/common";
import { SaasPortalController } from "./saas-portal.controller";
import { SaasPortalService } from "./saas-portal.service";
import { SaasPortalOrgHierarchyController } from "./controllers/org-hierarchy.controller";
import { SaasPortalOrgHierarchyService } from "./services/org-hierarchy.service";
import { SaasPortalGdprComplianceController } from "./controllers/gdpr-compliance.controller";
import { SaasPortalGdprComplianceService } from "./services/gdpr-compliance.service";
import { SaasPortalAuditLogController } from "./controllers/audit-log.controller";
import { SaasPortalAuditLogService } from "./services/audit-log.service";
import { SaasPortalSecurityController } from "./controllers/security.controller";
import { SaasPortalSecurityService } from "./services/security.service";
import { SaasPortalDelegationController } from "./controllers/delegation.controller";
import { SaasPortalDelegationService } from "./services/delegation.service";
import { SaasPortalBillingController } from "./controllers/billing.controller";
import { SaasPortalBillingService } from "./services/billing.service";
import { SaasPortalSubscriptionController } from "./controllers/subscription.controller";
import { SaasPortalSubscriptionService } from "./services/subscription.service";
import { SaasPortalBillingSelfServiceService } from "./saas-portal-billing-self-service.service";
import { SaasPortalBillingSelfServiceController } from "./saas-portal-billing-self-service.controller";
import { SaasPortalSubscriptionTierEngineService } from "./saas-portal-subscription-tier-engine.service";
import { SaasPortalSubscriptionTierEngineController } from "./saas-portal-subscription-tier-engine.controller";
import { SaasPortalUsageMetricsPortalService } from "./saas-portal-usage-metrics-portal.service";
import { SaasPortalUsageMetricsPortalController } from "./saas-portal-usage-metrics-portal.controller";
import { SaasPortalSupportSelfServiceService } from "./saas-portal-support-self-service.service";
import { SaasPortalSupportSelfServiceController } from "./saas-portal-support-self-service.controller";
import { SaasPortalFeedbackRoadmapService } from "./saas-portal-feedback-roadmap.service";
import { SaasPortalFeedbackRoadmapController } from "./saas-portal-feedback-roadmap.controller";
import { SaasPortalSsoSamlDeepService } from "./saas-portal-sso-saml-deep.service";
import { SaasPortalSsoSamlDeepController } from "./saas-portal-sso-saml-deep.controller";
import { SaasPortalAuditTrailDeepService } from "./saas-portal-audit-trail-deep.service";
import { SaasPortalAuditTrailDeepController } from "./saas-portal-audit-trail-deep.controller";
import { SaasPortalEnterpriseModule } from "./saas-portal-enterprise.module";

@Module({
  imports: [SaasPortalEnterpriseModule],
  controllers: [
    SaasPortalController,
    SaasPortalOrgHierarchyController,
    SaasPortalGdprComplianceController,
    SaasPortalAuditLogController,
    SaasPortalSecurityController,
    SaasPortalDelegationController,
    SaasPortalBillingController,
    SaasPortalSubscriptionController,
    SaasPortalBillingSelfServiceController,
    SaasPortalSubscriptionTierEngineController,
    SaasPortalUsageMetricsPortalController,
    SaasPortalSupportSelfServiceController,
    SaasPortalFeedbackRoadmapController,
    SaasPortalSsoSamlDeepController,
    SaasPortalAuditTrailDeepController,
  ],
  providers: [
    SaasPortalService,
    SaasPortalOrgHierarchyService,
    SaasPortalGdprComplianceService,
    SaasPortalAuditLogService,
    SaasPortalSecurityService,
    SaasPortalDelegationService,
    SaasPortalBillingService,
    SaasPortalSubscriptionService,
    SaasPortalBillingSelfServiceService,
    SaasPortalSubscriptionTierEngineService,
    SaasPortalUsageMetricsPortalService,
    SaasPortalSupportSelfServiceService,
    SaasPortalFeedbackRoadmapService,
    SaasPortalSsoSamlDeepService,
    SaasPortalAuditTrailDeepService,
  ],
  exports: [
    SaasPortalService,
    SaasPortalOrgHierarchyService,
    SaasPortalGdprComplianceService,
    SaasPortalAuditLogService,
    SaasPortalSecurityService,
    SaasPortalDelegationService,
    SaasPortalBillingService,
    SaasPortalSubscriptionService,
    SaasPortalBillingSelfServiceService,
    SaasPortalSubscriptionTierEngineService,
    SaasPortalUsageMetricsPortalService,
    SaasPortalSupportSelfServiceService,
    SaasPortalFeedbackRoadmapService,
    SaasPortalSsoSamlDeepService,
    SaasPortalAuditTrailDeepService,
  ],
})
export class SaasPortalModule {}
