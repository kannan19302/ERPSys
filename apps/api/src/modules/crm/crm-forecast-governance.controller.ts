import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmForecastGovernanceService } from "./crm-forecast-governance.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-forecast-governance")
@ApiBearerAuth()
@Controller("crm/forecast-governance")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmForecastGovernanceController {
  constructor(private readonly svc: CrmForecastGovernanceService) {}
  @Permissions("crm.governance-rule.read")
  @Get("fg_0")
  async g0() {
    return this.svc.getGovernanceRules();
  }
  @Permissions("crm.governance-rule.create")
  @Get("fg_1")
  async g1() {
    return this.svc.createGovernanceRule();
  }
  @Permissions("crm.forecast-audit-trail.read")
  @Get("fg_2")
  async g2() {
    return this.svc.getForecastAuditTrail();
  }
  @Permissions("crm.rollup-summary.read")
  @Get("fg_3")
  async g3() {
    return this.svc.getRollupSummary();
  }
}
