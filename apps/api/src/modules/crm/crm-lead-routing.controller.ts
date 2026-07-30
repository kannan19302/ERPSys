// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmLeadRoutingService } from "./crm-lead-routing.service";
@ApiTags("crm-lead-routing")
@ApiBearerAuth()
@Controller("crm/lead-routing")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadRoutingController {
  constructor(private readonly svc: CrmLeadRoutingService) {}
  @Get("lr_0") async g0() {
    return this.svc.getRoutingRules();
  }
  @Get("lr_1") async g1() {
    return this.svc.createRoutingRule();
  }
  @Get("lr_2") async g2() {
    return this.svc.updateRoutingRule();
  }
  @Get("lr_3") async g3() {
    return this.svc.deleteRoutingRule();
  }
  @Get("lr_4") async g4() {
    return this.svc.routeLead();
  }
  @Get("lr_5") async g5() {
    return this.svc.getRoundRobinState();
  }
  @Get("lr_6") async g6() {
    return this.svc.getRoutingHistory();
  }
}
