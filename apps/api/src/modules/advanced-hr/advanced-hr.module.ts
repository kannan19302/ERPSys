import { Module } from "@nestjs/common";
import { AdvancedHrController } from "./advanced-hr.controller";
import { AdvancedHrService } from "./advanced-hr.service";
import { PayrollTaxService } from "./payroll-tax.service";
import { HrDeepController } from "./hr-deep.controller";

import { AdvancedHrLearningPathsDeepService } from "./advanced-hr-learning-paths-deep.service";
import { AdvancedHrLearningPathsDeepController } from "./advanced-hr-learning-paths-deep.controller";
import { AdvancedHrSuccessionPlanningDeepService } from "./advanced-hr-succession-planning-deep.service";
import { AdvancedHrSuccessionPlanningDeepController } from "./advanced-hr-succession-planning-deep.controller";
import { AdvancedHrWorkforceAnalyticsDeepService } from "./advanced-hr-workforce-analytics-deep.service";
import { AdvancedHrWorkforceAnalyticsDeepController } from "./advanced-hr-workforce-analytics-deep.controller";
import { AdvancedHrCompensationBandsDeepService } from "./advanced-hr-compensation-bands-deep.service";
import { AdvancedHrCompensationBandsDeepController } from "./advanced-hr-compensation-bands-deep.controller";
import { AdvancedHrBenefitsAdminDeepService } from "./advanced-hr-benefits-admin-deep.service";
import { AdvancedHrBenefitsAdminDeepController } from "./advanced-hr-benefits-admin-deep.controller";
import { AdvancedHrOrgChartDeepService } from "./advanced-hr-org-chart-deep.service";
import { AdvancedHrOrgChartDeepController } from "./advanced-hr-org-chart-deep.controller";
import { AdvancedHrExitInterviewDeepService } from "./advanced-hr-exit-interview-deep.service";
import { AdvancedHrExitInterviewDeepController } from "./advanced-hr-exit-interview-deep.controller";

@Module({
  controllers: [
    AdvancedHrController,
    HrDeepController,
    AdvancedHrLearningPathsDeepController,
    AdvancedHrSuccessionPlanningDeepController,
    AdvancedHrWorkforceAnalyticsDeepController,
    AdvancedHrCompensationBandsDeepController,
    AdvancedHrBenefitsAdminDeepController,
    AdvancedHrOrgChartDeepController,
    AdvancedHrExitInterviewDeepController,
  ],
  providers: [
    AdvancedHrService,
    PayrollTaxService,
    AdvancedHrLearningPathsDeepService,
    AdvancedHrSuccessionPlanningDeepService,
    AdvancedHrWorkforceAnalyticsDeepService,
    AdvancedHrCompensationBandsDeepService,
    AdvancedHrBenefitsAdminDeepService,
    AdvancedHrOrgChartDeepService,
    AdvancedHrExitInterviewDeepService,
  ],
  exports: [
    AdvancedHrService,
    PayrollTaxService,
    AdvancedHrLearningPathsDeepService,
    AdvancedHrSuccessionPlanningDeepService,
    AdvancedHrWorkforceAnalyticsDeepService,
    AdvancedHrCompensationBandsDeepService,
    AdvancedHrBenefitsAdminDeepService,
    AdvancedHrOrgChartDeepService,
    AdvancedHrExitInterviewDeepService,
  ],
})
export class AdvancedHrModule {}
