import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { ActivityFeedController } from './activity-feed.controller';
import { ActivityFeedService } from './activity-feed.service';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { GdprController } from './gdpr.controller';
import { GdprService } from './gdpr.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { AutomationRulesController } from './automation-rules.controller';
import { AutomationRulesService } from './automation-rules.service';
import { RecycleBinController } from './recycle-bin.controller';
import { RecycleBinService } from './recycle-bin.service';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { DelegationController } from './delegation.controller';
import { DelegationService } from './delegation.service';
import { DataQualityController } from './data-quality.controller';
import { DataQualityService } from './data-quality.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { OrgHierarchyController } from './org-hierarchy.controller';
import { OrgHierarchyService } from './org-hierarchy.service';
import { BundleStoreService } from '../marketplace/bundle-store.service';
import { AppProvisioningService } from '../marketplace/app-provisioning.service';
import { VendorService } from '../marketplace/vendor.service';
import { StorefrontService } from '../marketplace/storefront.service';
import { DeveloperController } from '../marketplace/developer.controller';

@Module({
  controllers: [
    AdminController,
    SuperAdminController,
    SecurityController,
    ActivityFeedController,
    ImportExportController,
    GdprController,
    AnnouncementsController,
    OperationsController,
    PlatformController,
    CustomFieldsController,
    AutomationRulesController,
    RecycleBinController,
    AlertsController,
    MarketplaceController,
    BulkOperationsController,
    DelegationController,
    DataQualityController,
    SubscriptionController,
    OrgHierarchyController,
    DeveloperController,
  ],
  providers: [
    BundleStoreService,
    AppProvisioningService,
    VendorService,
    StorefrontService,
    AdminService,
    SuperAdminService,
    SecurityService,
    ActivityFeedService,
    ImportExportService,
    GdprService,
    AnnouncementsService,
    OperationsService,
    PlatformService,
    CustomFieldsService,
    AutomationRulesService,
    RecycleBinService,
    AlertsService,
    MarketplaceService,
    BulkOperationsService,
    DelegationService,
    DataQualityService,
    SubscriptionService,
    OrgHierarchyService,
  ],
  exports: [
    AdminService,
    SuperAdminService,
    SecurityService,
    ActivityFeedService,
    ImportExportService,
    GdprService,
    AnnouncementsService,
    OperationsService,
    PlatformService,
    CustomFieldsService,
    AutomationRulesService,
    RecycleBinService,
    AlertsService,
    MarketplaceService,
    BulkOperationsService,
    DelegationService,
    DataQualityService,
    SubscriptionService,
    OrgHierarchyService,
    BundleStoreService,
    AppProvisioningService,
    VendorService,
    StorefrontService,
  ],
})
export class AdminModule {}
