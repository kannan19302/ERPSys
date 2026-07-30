// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPipelineDeepService } from "./crm-pipeline-deep.service";
@ApiTags("crm-pipeline-deep")
@ApiBearerAuth()
@Controller("crm/pipeline-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPipelineDeepController {
  constructor(private readonly svc: CrmPipelineDeepService) {}
  @Get("pd_0") async g0() {
    return this.svc.getPipelineInspectionConfigs();
  }
  @Get("pd_1") async g1() {
    return this.svc.createConfig();
  }
  @Get("pd_2") async g2() {
    return this.svc.updateConfig();
  }
  @Get("pd_3") async g3() {
    return this.svc.deleteConfig();
  }
  @Get("pd_4") async g4() {
    return this.svc.runPipelineInspection();
  }
  @Get("pd_5") async g5() {
    return this.svc.getPipelineInspectionResults();
  }
  @Get("pd_6") async g6() {
    return this.svc.getDealComparison();
  }
  @Get("pd_7") async g7() {
    return this.svc.getDealAnalyticsDashboard();
  }
  @Get("pd_8") async g8() {
    return this.svc.getStageConversionRates();
  }
  @Get("pd_9") async g9() {
    return this.svc.getStageDurationAnalysis();
  }
  @Get("pd_10") async g10() {
    return this.svc.getDealSizeDistribution();
  }
  @Get("pd_11") async g11() {
    return this.svc.getWinRateByStage();
  }
  @Get("pd_12") async g12() {
    return this.svc.getLossReasonAnalysis();
  }
  @Get("pd_13") async g13() {
    return this.svc.getWinRateBySource();
  }
  @Get("pd_14") async g14() {
    return this.svc.getSalesCycleByProduct();
  }
  @Get("pd_15") async g15() {
    return this.svc.getForecastVsActualByRep();
  }
}
