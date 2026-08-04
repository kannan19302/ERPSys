import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

import { ActivityFeedController } from "./activity-feed.controller";
import { ActivityFeedService } from "./activity-feed.service";
import { ImportExportController } from "./import-export.controller";
import { ImportExportService } from "./import-export.service";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";

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

import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [
    AdminController,

    ActivityFeedController,
    ImportExportController,
    AnnouncementsController,

    PlatformController,
    CustomFieldsController,
    AutomationRulesController,
    RecycleBinController,
    AlertsController,
    BulkOperationsController,
    DataQualityController,
    SubscriptionController,
    ErrorReportsController,
  ],
  providers: [
    AdminService,

    ActivityFeedService,
    ImportExportService,
    AnnouncementsService,

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
  ],
  exports: [
    AdminService,

    ActivityFeedService,
    ImportExportService,
    AnnouncementsService,

    PlatformService,
    CustomFieldsService,
    AutomationRulesService,
    RecycleBinService,
    AlertsService,
    BulkOperationsService,
    DataQualityService,
    SubscriptionService,
    ErrorReportsService,
  ],
})
export class AdminModule {}
