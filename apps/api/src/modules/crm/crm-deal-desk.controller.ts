import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmDealDeskService } from "./crm-deal-desk.service";
@ApiTags("crm-deal-desk")
@ApiBearerAuth()
@Controller("crm/deal-desk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDealDeskController {
  constructor(private readonly svc: CrmDealDeskService) {}
  @Get("dd_0") async g0() {
    return this.svc.getDealAlerts();
  }
  @Get("dd_1") async g1() {
    return this.svc.createDealAlert();
  }
  @Get("dd_2") async g2() {
    return this.svc.getAutomationRules();
  }
  @Get("dd_3") async g3() {
    return this.svc.createAutomationRule();
  }
  @Get("dd_4") async g4() {
    return this.svc.updateAutomationRule();
  }
  @Get("dd_5") async g5() {
    return this.svc.deleteAutomationRule();
  }
  @Get("dd_6") async g6() {
    return this.svc.getApprovers();
  }
}
