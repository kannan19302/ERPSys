import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmIncentiveDeepService } from "./crm-incentive-deep.service";
@ApiTags("crm-incentive-deep")
@ApiBearerAuth()
@Controller("crm/incentive-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmIncentiveDeepController {
  constructor(private readonly svc: CrmIncentiveDeepService) {}
  @Get("inc_0") async g0() {
    return this.svc.getCommissionPlans();
  }
  @Get("inc_1") async g1() {
    return this.svc.createCommissionPlan();
  }
  @Get("inc_2") async g2() {
    return this.svc.calculateCommission();
  }
  @Get("inc_3") async g3() {
    return this.svc.getClawbackRules();
  }
  @Get("inc_4") async g4() {
    return this.svc.createClawbackRule();
  }
}
