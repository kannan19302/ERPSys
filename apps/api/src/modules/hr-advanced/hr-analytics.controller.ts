// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { HrAnalyticsService } from "./hr-analytics.service";
@ApiTags("hr-analytics")
@ApiBearerAuth()
@Controller("hr/analytics")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrAnalyticsController {
  constructor(private readonly svc: HrAnalyticsService) {}
  @Get("ha_0") async g0() {
    return this.svc.getHeadcountPlans();
  }
  @Get("ha_1") async g1() {
    return this.svc.getHeadcountPlanById();
  }
  @Get("ha_2") async g2() {
    return this.svc.createHeadcountPlan();
  }
  @Get("ha_3") async g3() {
    return this.svc.updateHeadcountPlan();
  }
  @Get("ha_4") async g4() {
    return this.svc.approveHeadcountPlan();
  }
  @Get("ha_5") async g5() {
    return this.svc.getHeadcountSummary();
  }
  @Get("ha_6") async g6() {
    return this.svc.getHeadcountPlanLines();
  }
  @Get("ha_7") async g7() {
    return this.svc.createHeadcountPlanLine();
  }
  @Get("ha_8") async g8() {
    return this.svc.updateHeadcountPlanLine();
  }
  @Get("ha_9") async g9() {
    return this.svc.deleteHeadcountPlanLine();
  }
  @Get("ha_10") async g10() {
    return this.svc.getSuccessionPlans();
  }
  @Get("ha_11") async g11() {
    return this.svc.getSuccessionPlanById();
  }
  @Get("ha_12") async g12() {
    return this.svc.createSuccessionPlan();
  }
  @Get("ha_13") async g13() {
    return this.svc.updateSuccessionPlan();
  }
}
