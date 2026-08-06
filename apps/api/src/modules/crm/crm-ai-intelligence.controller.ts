import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmAiIntelligenceService } from "./crm-ai-intelligence.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-ai-intelligence")
@ApiBearerAuth()
@Controller("crm/ai-intelligence")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmAiIntelligenceController {
  constructor(private readonly svc: CrmAiIntelligenceService) {}
  @Permissions("crm.insight.read")
  @Get("ai_0")
  async g0() {
    return this.svc.getInsights();
  }
  @Permissions("crm.recommendation.generate")
  @Get("ai_1")
  async g1() {
    return this.svc.generateRecommendations();
  }
  @Permissions("crm.scorecard.read")
  @Get("ai_2")
  async g2() {
    return this.svc.getScorecard();
  }
  @Permissions("crm.deal-outcome.predict")
  @Get("ai_3")
  async g3() {
    return this.svc.predictDealOutcome();
  }
}
