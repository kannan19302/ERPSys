import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCustomerJourneyService } from "./crm-customer-journey.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-customer-journey")
@ApiBearerAuth()
@Controller("crm/customer-journey")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCustomerJourneyController {
  constructor(private readonly svc: CrmCustomerJourneyService) {}
  @Permissions("crm.journey.read")
  @Get("cj_0")
  async g0() {
    return this.svc.getJourneys();
  }
  @Permissions("crm.journey.create")
  @Get("cj_1")
  async g1() {
    return this.svc.createJourney();
  }
  @Permissions("crm.milestone.read")
  @Get("cj_2")
  async g2() {
    return this.svc.getMilestones();
  }
  @Permissions("crm.health-score.read")
  @Get("cj_3")
  async g3() {
    return this.svc.getHealthScores();
  }
}
