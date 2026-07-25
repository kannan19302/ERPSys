import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmSalesGamificationEventsService } from "./crm-sales-gamification-events.service";
@ApiTags("crm-sales-gamification-events")
@ApiBearerAuth()
@Controller("crm/sales-gamification-events")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSalesGamificationEventsController {
  constructor(private readonly svc: CrmSalesGamificationEventsService) {}
  @Get("ge_0") async g0() {
    return this.svc.getLeaderboard();
  }
  @Get("ge_1") async g1() {
    return this.svc.triggerGongEvent();
  }
  @Get("ge_2") async g2() {
    return this.svc.getUserBadges();
  }
  @Get("ge_3") async g3() {
    return this.svc.getGamificationAnalytics();
  }
}
