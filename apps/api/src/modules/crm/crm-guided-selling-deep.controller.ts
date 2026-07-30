// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmGuidedSellingDeepService } from "./crm-guided-selling-deep.service";
@ApiTags("crm-guided-selling-deep")
@ApiBearerAuth()
@Controller("crm/guided-selling-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGuidedSellingDeepController {
  constructor(private readonly svc: CrmGuidedSellingDeepService) {}
  @Get("gs_0") async g0() {
    return this.svc.getPlaybooks();
  }
  @Get("gs_1") async g1() {
    return this.svc.createPlaybook();
  }
  @Get("gs_2") async g2() {
    return this.svc.getRecommendedActions();
  }
  @Get("gs_3") async g3() {
    return this.svc.getBattlecards();
  }
}
