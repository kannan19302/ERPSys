// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmBehavioralAnalyticsService } from "./crm-behavioral-analytics.service";
@ApiTags("crm-behavioral-analytics")
@ApiBearerAuth()
@Controller("crm/behavioral-analytics")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmBehavioralAnalyticsController {
  constructor(private readonly svc: CrmBehavioralAnalyticsService) {}
  @Get("ba_0") async g0() {
    return this.svc.getBehavioralEvents();
  }
  @Get("ba_1") async g1() {
    return this.svc.trackEvent();
  }
  @Get("ba_2") async g2() {
    return this.svc.getEngagementScores();
  }
  @Get("ba_3") async g3() {
    return this.svc.getInteractionHistory();
  }
}
