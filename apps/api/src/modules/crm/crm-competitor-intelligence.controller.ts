import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCompetitorIntelligenceService } from "./crm-competitor-intelligence.service";
@ApiTags("crm-competitor-intelligence")
@ApiBearerAuth()
@Controller("crm/competitor-intelligence")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCompetitorIntelligenceController {
  constructor(private readonly svc: CrmCompetitorIntelligenceService) {}
  @Get("ci_0") async g0() {
    return this.svc.getCompetitors();
  }
  @Get("ci_1") async g1() {
    return this.svc.createCompetitor();
  }
  @Get("ci_2") async g2() {
    return this.svc.getBattlecards();
  }
  @Get("ci_3") async g3() {
    return this.svc.getWinLossAnalysis();
  }
}
