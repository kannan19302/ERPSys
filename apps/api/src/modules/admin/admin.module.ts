import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { SuperAdminController } from "./super-admin.controller";
import { SuperAdminService } from "./super-admin.service";
import { ActivityFeedController } from "./activity-feed.controller";
import { ActivityFeedService } from "./activity-feed.service";
import { ImportExportController } from "./import-export.controller";
import { ImportExportService } from "./import-export.service";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { CustomFieldsController } from "./custom-fields.controller";
import { CustomFieldsService } from "./custom-fields.service";
import { AutomationRulesController } from "./automation-rules.controller";
import { AutomationRulesService } from "./automation-rules.service";
import { AutomationRuleEngineService } from "./automation-rule-engine.service";
import { RecycleBinController } from "./recycle-bin.controller";
import { RecycleBinService } from "./recycle-bin.service";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";
import { BulkOperationsController } from "./bulk-operations.controller";
import { BulkOperationsService } from "./bulk-operations.service";
import { DataQualityController } from "./data-quality.controller";
import { DataQualityService } from "./data-quality.service";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { ErrorReportsController } from "./error-reports.controller";
import { ErrorReportsService } from "./error-reports.service";
import { TenantLifecycleController } from "./tenant-lifecycle/tenant-lifecycle.controller";
import { TenantLifecycleService } from "./tenant-lifecycle/tenant-lifecycle.service";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [
    AdminController,
    SuperAdminController,
    ActivityFeedController,
    ImportExportController,
    AnnouncementsController,
    OperationsController,
    PlatformController,
    CustomFieldsController,
    AutomationRulesController,
    RecycleBinController,
    AlertsController,
    BulkOperationsController,
    DataQualityController,
    SubscriptionController,
    ErrorReportsController,
    TenantLifecycleController,
  ],
  providers: [
    AdminService,
    SuperAdminService,
    ActivityFeedService,
    ImportExportService,
    AnnouncementsService,
    OperationsService,
    PlatformService,
    CustomFieldsService,
    AutomationRulesService,
    AutomationRuleEngineService,
    RecycleBinService,
    AlertsService,
    BulkOperationsService,
    DataQualityService,
    SubscriptionService,
    ErrorReportsService,
    TenantLifecycleService,
  ],
  exports: [
    AdminService,
    SuperAdminService,
    ActivityFeedService,
    ImportExportService,
    AnnouncementsService,
    OperationsService,
    PlatformService,
    CustomFieldsService,
    AutomationRulesService,
    RecycleBinService,
    AlertsService,
    BulkOperationsService,
    DataQualityService,
    SubscriptionService,
    TenantLifecycleService,
  ],
})
export class AdminModule {}
