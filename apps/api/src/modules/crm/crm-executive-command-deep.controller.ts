import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmExecutiveCommandDeepService } from "./crm-executive-command-deep.service";
@ApiTags("crm-executive-command-deep")
@ApiBearerAuth()
@Controller("crm/executive-command-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmExecutiveCommandDeepController {
  constructor(private readonly svc: CrmExecutiveCommandDeepService) {}
  @Get("ec_0") async g0() {
    return this.svc.getExecutiveDashboard();
  }
  @Get("ec_1") async g1() {
    return this.svc.getPipelineSummary();
  }
  @Get("ec_2") async g2() {
    return this.svc.getRevenueForecast();
  }
  @Get("ec_3") async g3() {
    return this.svc.getSalesPerformanceMetrics();
  }
}
