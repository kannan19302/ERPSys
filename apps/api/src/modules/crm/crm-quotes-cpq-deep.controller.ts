import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmQuotesCpqDeepService } from "./crm-quotes-cpq-deep.service";
@ApiTags("crm-quotes-cpq-deep")
@ApiBearerAuth()
@Controller("crm/quotes-cpq-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmQuotesCpqDeepController {
  constructor(private readonly svc: CrmQuotesCpqDeepService) {}
  @Get("cpq_0") async g0() {
    return this.svc.generateQuoteBundle();
  }
  @Get("cpq_1") async g1() {
    return this.svc.getQuoteBundles();
  }
  @Get("cpq_2") async g2() {
    return this.svc.getDiscountApprovalMatrix();
  }
  @Get("cpq_3") async g3() {
    return this.svc.getMarginAnalysis();
  }
}
