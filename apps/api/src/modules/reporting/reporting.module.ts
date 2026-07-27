import { Module } from "@nestjs/common";
import { ReportingController } from "./reporting.controller";
import { ReportingService } from "./reporting.service";
import { ScheduledReportsController } from "./scheduled-reports.controller";
import { ScheduledReportsService } from "./scheduled-reports.service";
import { ReportingEngineService } from "./reporting-engine.service";
import { ReportingEngineController } from "./reporting-engine.controller";

import { ReportingTemplatesDeepService } from "./reporting-templates-deep.service";
import { ReportingTemplatesDeepController } from "./reporting-templates-deep.controller";
import { ReportingScheduledJobsDeepService } from "./reporting-scheduled-jobs-deep.service";
import { ReportingScheduledJobsDeepController } from "./reporting-scheduled-jobs-deep.controller";
import { ReportingExportsDeepService } from "./reporting-exports-deep.service";
import { ReportingExportsDeepController } from "./reporting-exports-deep.controller";
import { ReportingComplianceSignoffDeepService } from "./reporting-compliance-signoff-deep.service";
import { ReportingComplianceSignoffDeepController } from "./reporting-compliance-signoff-deep.controller";
import { ReportingDistributionListsDeepService } from "./reporting-distribution-lists-deep.service";
import { ReportingDistributionListsDeepController } from "./reporting-distribution-lists-deep.controller";
import { ReportingInteractiveViewerDeepService } from "./reporting-interactive-viewer-deep.service";
import { ReportingInteractiveViewerDeepController } from "./reporting-interactive-viewer-deep.controller";
import { ReportingDataDrilldownDeepService } from "./reporting-data-drilldown-deep.service";
import { ReportingDataDrilldownDeepController } from "./reporting-data-drilldown-deep.controller";

@Module({
  controllers: [
    ReportingController,
    ScheduledReportsController,
    ReportingEngineController,
    ReportingTemplatesDeepController,
    ReportingScheduledJobsDeepController,
    ReportingExportsDeepController,
    ReportingComplianceSignoffDeepController,
    ReportingDistributionListsDeepController,
    ReportingInteractiveViewerDeepController,
    ReportingDataDrilldownDeepController,
  ],
  providers: [
    ReportingService,
    ScheduledReportsService,
    ReportingEngineService,
    ReportingTemplatesDeepService,
    ReportingScheduledJobsDeepService,
    ReportingExportsDeepService,
    ReportingComplianceSignoffDeepService,
    ReportingDistributionListsDeepService,
    ReportingInteractiveViewerDeepService,
    ReportingDataDrilldownDeepService,
  ],
  exports: [
    ReportingService,
    ScheduledReportsService,
    ReportingEngineService,
    ReportingTemplatesDeepService,
    ReportingScheduledJobsDeepService,
    ReportingExportsDeepService,
    ReportingComplianceSignoffDeepService,
    ReportingDistributionListsDeepService,
    ReportingInteractiveViewerDeepService,
    ReportingDataDrilldownDeepService,
  ],
})
export class ReportingModule {}
