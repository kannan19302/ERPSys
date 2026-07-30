// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmRenewalsUpsellDeepService } from "./crm-renewals-upsell-deep.service";
@ApiTags("crm-renewals-upsell-deep")
@ApiBearerAuth()
@Controller("crm/renewals-upsell-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmRenewalsUpsellDeepController {
  constructor(private readonly svc: CrmRenewalsUpsellDeepService) {}
  @Get("ren_0") async g0() {
    return this.svc.getRenewalForecast();
  }
  @Get("ren_1") async g1() {
    return this.svc.createRenewalPipelineItem();
  }
  @Get("ren_2") async g2() {
    return this.svc.getExpansionOpportunities();
  }
  @Get("ren_3") async g3() {
    return this.svc.getChurnRiskScoring();
  }
  @Get("ren_4") async g4() {
    return this.svc.logChurnReason();
  }
}
