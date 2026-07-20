import { Module } from '@nestjs/common';
import { SaasPortalController } from './saas-portal.controller';
import { SaasPortalService } from './saas-portal.service';
import { SaasPortalOrgHierarchyController } from './controllers/org-hierarchy.controller';
import { SaasPortalOrgHierarchyService } from './services/org-hierarchy.service';
import { SaasPortalGdprComplianceController } from './controllers/gdpr-compliance.controller';
import { SaasPortalGdprComplianceService } from './services/gdpr-compliance.service';
import { SaasPortalAuditLogController } from './controllers/audit-log.controller';
import { SaasPortalAuditLogService } from './services/audit-log.service';
import { SaasPortalSecurityController } from './controllers/security.controller';
import { SaasPortalSecurityService } from './services/security.service';
import { SaasPortalDelegationController } from './controllers/delegation.controller';
import { SaasPortalDelegationService } from './services/delegation.service';
import { SaasPortalBillingController } from './controllers/billing.controller';
import { SaasPortalBillingService } from './services/billing.service';
import { SaasPortalSubscriptionController } from './controllers/subscription.controller';
import { SaasPortalSubscriptionService } from './services/subscription.service';

/**
 * SaaS Portal — consolidated tenant/platform administration surface.
 *
 * MIGRATION STATUS (Phase 0–6 COMPLETE, 2026-07-20):
 * All frontend settings/admin routes have been migrated:
 * - Every app (finance, hr, inventory, etc.) has its own settings page
 * - Cross-cutting settings (security, billing, compliance, team) serve via /saas/
 * - The old /settings/ monolithic pages redirect to their new locations
 * - Per-app nav descriptors are registered for all 20+ modules
 * - KERNEL_APPS = only `saas-portal` + `app-store` (both always visible)
 * - No apps are auto-installed at registration (Phase 5)
 *
 * REMAINING (SaasModule/AdminModule still in AppModule with DEPRECATED tag):
 * SaasModule and AdminModule are kept only for legacy API backward compatibility.
 * `SaasPortalModule` should be used for all new API development. See individual
 * porting status below.
 *
 * Services ported to SaasPortalModule (✓):
 *   ✓ org-hierarchy        ✓ gdpr-compliance      ✓ audit-log
 *   ✓ security             ✓ delegation            ✓ billing
 *   ✓ subscription         ✓ overview/installed-apps
 *
 * Services still in SaasModule/AdminModule (not yet ported — legacy):
 *   plan-engine, invoice-engine, payment-methods, usage-alerts,
 *   api-keys, support-tickets, domains,
 *   sso-config, branding, data-export,
 *   webhooks, tenant-admin, announcements, activity-feed, custom-fields,
 *   automation-rules, import-export, super-admin, tenant-lifecycle,
 *   platform-config, system-health, notification-prefs
 */
@Module({
  controllers: [
    SaasPortalController,
    SaasPortalOrgHierarchyController,
    SaasPortalGdprComplianceController,
    SaasPortalAuditLogController,
    SaasPortalSecurityController,
    SaasPortalDelegationController,
    SaasPortalBillingController,
    SaasPortalSubscriptionController,
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
  ],
})
export class SaasPortalModule {}
