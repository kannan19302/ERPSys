// @ts-nocheck
import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsExpansionController } from "./analytics-expansion.controller";
import { AnalyticsExpansionService } from "./analytics-expansion.service";

import { AnalyticsCustomDashboardsDeepService } from "./analytics-custom-dashboards-deep.service";
import { AnalyticsCustomDashboardsDeepController } from "./analytics-custom-dashboards-deep.controller";
import { AnalyticsDataPipelinesDeepService } from "./analytics-data-pipelines-deep.service";
import { AnalyticsDataPipelinesDeepController } from "./analytics-data-pipelines-deep.controller";
import { AnalyticsPredictiveEngineDeepService } from "./analytics-predictive-engine-deep.service";
import { AnalyticsPredictiveEngineDeepController } from "./analytics-predictive-engine-deep.controller";
import { AnalyticsCohortRetentionDeepService } from "./analytics-cohort-retention-deep.service";
import { AnalyticsCohortRetentionDeepController } from "./analytics-cohort-retention-deep.controller";
import { AnalyticsFunnelConversionDeepService } from "./analytics-funnel-conversion-deep.service";
import { AnalyticsFunnelConversionDeepController } from "./analytics-funnel-conversion-deep.controller";
import { AnalyticsRealtimeStreamDeepService } from "./analytics-realtime-stream-deep.service";
import { AnalyticsRealtimeStreamDeepController } from "./analytics-realtime-stream-deep.controller";
import { AnalyticsAnomalyDetectionDeepService } from "./analytics-anomaly-detection-deep.service";
import { AnalyticsAnomalyDetectionDeepController } from "./analytics-anomaly-detection-deep.controller";
import { AnalyticsDeepService } from "./analytics-deep.service";
import { AnalyticsDeepController } from "./analytics-deep.controller";
import { AnalyticsEnterpriseModule } from "./analytics-enterprise.module";
import { AnalyticsEnterpriseController } from "./analytics-enterprise.controller";
import { AnalyticsEnterpriseService } from "./analytics-enterprise.service";

@Module({
  imports: [AnalyticsEnterpriseModule],
  controllers: [
    AnalyticsController,
    AnalyticsExpansionController,
    AnalyticsCustomDashboardsDeepController,
    AnalyticsDataPipelinesDeepController,
    AnalyticsPredictiveEngineDeepController,
    AnalyticsCohortRetentionDeepController,
    AnalyticsFunnelConversionDeepController,
    AnalyticsRealtimeStreamDeepController,
    AnalyticsAnomalyDetectionDeepController,
    AnalyticsDeepController,
    AnalyticsEnterpriseController,
  ],
  providers: [
    AnalyticsService,
    AnalyticsExpansionService,
    AnalyticsCustomDashboardsDeepService,
    AnalyticsDataPipelinesDeepService,
    AnalyticsPredictiveEngineDeepService,
    AnalyticsCohortRetentionDeepService,
    AnalyticsFunnelConversionDeepService,
    AnalyticsRealtimeStreamDeepService,
    AnalyticsAnomalyDetectionDeepService,
    AnalyticsDeepService,
    AnalyticsEnterpriseService,
    AnalyticsEnterpriseController,
  ],
  exports: [
    AnalyticsService,
    AnalyticsExpansionService,
    AnalyticsCustomDashboardsDeepService,
    AnalyticsDataPipelinesDeepService,
    AnalyticsPredictiveEngineDeepService,
    AnalyticsCohortRetentionDeepService,
    AnalyticsFunnelConversionDeepService,
    AnalyticsRealtimeStreamDeepService,
    AnalyticsAnomalyDetectionDeepService,
    AnalyticsDeepService,
    AnalyticsEnterpriseService,
  ],
})
export class AnalyticsModule {}
