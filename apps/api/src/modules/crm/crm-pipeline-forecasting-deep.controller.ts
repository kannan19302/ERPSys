import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPipelineForecastingDeepService } from "./crm-pipeline-forecasting-deep.service";
@ApiTags("crm-pipeline-forecasting-deep")
@ApiBearerAuth()
@Controller("crm/pipeline-forecasting-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPipelineForecastingDeepController {
  constructor(private readonly svc: CrmPipelineForecastingDeepService) {}
  @Get("pfd_0") async g0() {
    return this.svc.getForecastingDashboard();
  }
  @Get("pfd_1") async g1() {
    return this.svc.getPipelineCategories();
  }
  @Get("pfd_2") async g2() {
    return this.svc.createPipelineCategory();
  }
  @Get("pfd_3") async g3() {
    return this.svc.getRepQuotaProgress();
  }
  @Get("pfd_4") async g4() {
    return this.svc.getForecastSubmissions();
  }
  @Get("pfd_5") async g5() {
    return this.svc.submitForecast();
  }
  @Get("pfd_6") async g6() {
    return this.svc.getManagerRollup();
  }
  @Get("pfd_7") async g7() {
    return this.svc.getAiForecastModel();
  }
  @Get("pfd_8") async g8() {
    return this.svc.getHistoricalWinRates();
  }
}
