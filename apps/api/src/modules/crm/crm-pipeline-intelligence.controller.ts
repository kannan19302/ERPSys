import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPipelineIntelligenceService } from "./crm-pipeline-intelligence.service";
@ApiTags("crm-pipeline-intelligence")
@ApiBearerAuth()
@Controller("crm/pipeline-intelligence")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPipelineIntelligenceController {
  constructor(private readonly svc: CrmPipelineIntelligenceService) {}
  @Get("pi_0") async g0() {
    return this.svc.getPipelineHealthScore();
  }
  @Get("pi_1") async g1() {
    return this.svc.getDealVelocity();
  }
  @Get("pi_2") async g2() {
    return this.svc.getSlippageRiskAlerts();
  }
  @Get("pi_3") async g3() {
    return this.svc.getDealPushRate();
  }
}
