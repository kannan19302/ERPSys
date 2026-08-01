import { Module } from "@nestjs/common";
import { AnalyticsEnterpriseController } from "./analytics-enterprise.controller";
import { AnalyticsEnterpriseService } from "./analytics-enterprise.service";

@Module({
  controllers: [AnalyticsEnterpriseController],
  providers: [AnalyticsEnterpriseService, AnalyticsEnterpriseController],
  exports: [AnalyticsEnterpriseService],
})
export class AnalyticsEnterpriseModule {}
