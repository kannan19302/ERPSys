import { Module } from "@nestjs/common";
import { HrAdvancedController } from "./hr-advanced.controller";
import { HrAdvancedService } from "./hr-advanced.service";
import { HrTalentController } from "./hr-talent.controller";
import { HrTalentService } from "./hr-talent.service";
import { HrCompensationController } from "./hr-compensation.controller";
import { HrCompensationService } from "./hr-compensation.service";
import { HrOperationsController } from "./hr-operations.controller";
import { HrOperationsService } from "./hr-operations.service";
import { HrExperienceController } from "./hr-experience.controller";
import { HrExperienceService } from "./hr-experience.service";
import { HrWorkforceAnalyticsDeepService } from "./hr-workforce-analytics-deep.service";
import { HrWorkforceAnalyticsDeepController } from "./hr-workforce-analytics-deep.controller";
import { HrGlobalPayrollDeepService } from "./hr-global-payroll-deep.service";
import { HrGlobalPayrollDeepController } from "./hr-global-payroll-deep.controller";
import { HrTalentAcquisitionDeepService } from "./hr-talent-acquisition-deep.service";
import { HrTalentAcquisitionDeepController } from "./hr-talent-acquisition-deep.controller";
import { HrPerformanceAppraisalsDeepService } from "./hr-performance-appraisals-deep.service";
import { HrPerformanceAppraisalsDeepController } from "./hr-performance-appraisals-deep.controller";
import { HrBenefitsAdministrationDeepService } from "./hr-benefits-administration-deep.service";
import { HrBenefitsAdministrationDeepController } from "./hr-benefits-administration-deep.controller";
import { HrTimeAttendanceDeepService } from "./hr-time-attendance-deep.service";
import { HrTimeAttendanceDeepController } from "./hr-time-attendance-deep.controller";
import { HrComplianceSafetyDeepService } from "./hr-compliance-safety-deep.service";
import { HrComplianceSafetyDeepController } from "./hr-compliance-safety-deep.controller";
import { HrOrgChartSuccessionDeepService } from "./hr-org-chart-succession-deep.service";
import { HrOrgChartSuccessionDeepController } from "./hr-org-chart-succession-deep.controller";

// ── New Deep Feature Packs (Phase 2 — Push HR to 1500+) ──
@Module({
  controllers: [
    HrAdvancedController,
    HrTalentController,
    HrCompensationController,
    HrOperationsController,
    HrExperienceController,
    HrWorkforceAnalyticsDeepController,
    HrGlobalPayrollDeepController,
    HrTalentAcquisitionDeepController,
    HrPerformanceAppraisalsDeepController,
    HrBenefitsAdministrationDeepController,
    HrTimeAttendanceDeepController,
    HrComplianceSafetyDeepController,
    HrOrgChartSuccessionDeepController,
    // Phase 2 Deep Feature Packs
  ],
  providers: [
    HrAdvancedService,
    HrTalentService,
    HrCompensationService,
    HrOperationsService,
    HrExperienceService,
    HrWorkforceAnalyticsDeepService,
    HrGlobalPayrollDeepService,
    HrTalentAcquisitionDeepService,
    HrPerformanceAppraisalsDeepService,
    HrBenefitsAdministrationDeepService,
    HrTimeAttendanceDeepService,
    HrComplianceSafetyDeepService,
    HrOrgChartSuccessionDeepService,
    // Phase 2 Deep Feature Packs
  ],
  exports: [
    HrAdvancedService,
    HrTalentService,
    HrCompensationService,
    HrOperationsService,
    HrExperienceService,
    HrWorkforceAnalyticsDeepService,
    HrGlobalPayrollDeepService,
    HrTalentAcquisitionDeepService,
    HrPerformanceAppraisalsDeepService,
    HrBenefitsAdministrationDeepService,
    HrTimeAttendanceDeepService,
    HrComplianceSafetyDeepService,
    HrOrgChartSuccessionDeepService,
    // Phase 2 Deep Feature Packs
  ],
})
export class HrAdvancedModule {}
