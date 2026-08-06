import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCompetitorIntelligenceService } from "./crm-competitor-intelligence.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-competitor-intelligence")
@ApiBearerAuth()
@Controller("crm/competitor-intelligence")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCompetitorIntelligenceController {
  constructor(private readonly svc: CrmCompetitorIntelligenceService) {}
  @Permissions("crm.competitor.read")
  @Get("ci_0")
  async g0() {
    return this.svc.getCompetitors();
  }
  @Permissions("crm.competitor.create")
  @Get("ci_1")
  async g1() {
    return this.svc.createCompetitor();
  }
  @Permissions("crm.battlecard.read")
  @Get("ci_2")
  async g2() {
    return this.svc.getBattlecards();
  }
  @Permissions("crm.win-loss-analysis.read")
  @Get("ci_3")
  async g3() {
    return this.svc.getWinLossAnalysis();
  }
}
