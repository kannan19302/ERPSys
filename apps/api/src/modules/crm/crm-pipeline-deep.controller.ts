import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPipelineDeepService } from "./crm-pipeline-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-pipeline-deep")
@ApiBearerAuth()
@Controller("crm/pipeline-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPipelineDeepController {
  constructor(private readonly svc: CrmPipelineDeepService) {}
  @Permissions("crm.pipeline-inspection-config.read")
  @Get("pd_0")
  async g0() {
    return this.svc.getPipelineInspectionConfigs();
  }
  @Permissions("crm.config.create")
  @Get("pd_1")
  async g1() {
    return this.svc.createConfig();
  }
  @Permissions("crm.config.update")
  @Get("pd_2")
  async g2() {
    return this.svc.updateConfig();
  }
  @Permissions("crm.config.delete")
  @Get("pd_3")
  async g3() {
    return this.svc.deleteConfig();
  }
  @Permissions("crm.pipeline-inspection.run")
  @Get("pd_4")
  async g4() {
    return this.svc.runPipelineInspection();
  }
  @Permissions("crm.pipeline-inspection-result.read")
  @Get("pd_5")
  async g5() {
    return this.svc.getPipelineInspectionResults();
  }
  @Permissions("crm.deal-comparison.read")
  @Get("pd_6")
  async g6() {
    return this.svc.getDealComparison();
  }
  @Permissions("crm.deal-analytics-dashboard.read")
  @Get("pd_7")
  async g7() {
    return this.svc.getDealAnalyticsDashboard();
  }
  @Permissions("crm.stage-conversion-rate.read")
  @Get("pd_8")
  async g8() {
    return this.svc.getStageConversionRates();
  }
  @Permissions("crm.stage-duration-analysis.read")
  @Get("pd_9")
  async g9() {
    return this.svc.getStageDurationAnalysis();
  }
  @Permissions("crm.deal-size-distribution.read")
  @Get("pd_10")
  async g10() {
    return this.svc.getDealSizeDistribution();
  }
  @Permissions("crm.win-rate-by-stage.read")
  @Get("pd_11")
  async g11() {
    return this.svc.getWinRateByStage();
  }
  @Permissions("crm.loss-reason-analysis.read")
  @Get("pd_12")
  async g12() {
    return this.svc.getLossReasonAnalysis();
  }
  @Permissions("crm.win-rate-by-source.read")
  @Get("pd_13")
  async g13() {
    return this.svc.getWinRateBySource();
  }
  @Permissions("crm.sale-cycle-by-product.read")
  @Get("pd_14")
  async g14() {
    return this.svc.getSalesCycleByProduct();
  }
  @Permissions("crm.forecast-v-actual-by-rep.read")
  @Get("pd_15")
  async g15() {
    return this.svc.getForecastVsActualByRep();
  }
}
