import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmDealDeskService } from "./crm-deal-desk.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-deal-desk")
@ApiBearerAuth()
@Controller("crm/deal-desk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDealDeskController {
  constructor(private readonly svc: CrmDealDeskService) {}
  @Permissions("crm.deal-alert.read")
  @Get("dd_0")
  async g0() {
    return this.svc.getDealAlerts();
  }
  @Permissions("crm.deal-alert.create")
  @Get("dd_1")
  async g1() {
    return this.svc.createDealAlert();
  }
  @Permissions("crm.automation-rule.read")
  @Get("dd_2")
  async g2() {
    return this.svc.getAutomationRules();
  }
  @Permissions("crm.automation-rule.create")
  @Get("dd_3")
  async g3() {
    return this.svc.createAutomationRule();
  }
  @Permissions("crm.automation-rule.update")
  @Get("dd_4")
  async g4() {
    return this.svc.updateAutomationRule();
  }
  @Permissions("crm.automation-rule.delete")
  @Get("dd_5")
  async g5() {
    return this.svc.deleteAutomationRule();
  }
  @Permissions("crm.approver.read")
  @Get("dd_6")
  async g6() {
    return this.svc.getApprovers();
  }
}
