// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmSalesCadenceDeepService } from "./crm-sales-cadence-deep.service";
@ApiTags("crm-sales-cadence-deep")
@ApiBearerAuth()
@Controller("crm/sales-cadence-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSalesCadenceDeepController {
  constructor(private readonly svc: CrmSalesCadenceDeepService) {}
  @Get("sc_0") async g0() {
    return this.svc.getCadences();
  }
  @Get("sc_1") async g1() {
    return this.svc.createCadence();
  }
  @Get("sc_2") async g2() {
    return this.svc.updateCadence();
  }
  @Get("sc_3") async g3() {
    return this.svc.deleteCadence();
  }
  @Get("sc_4") async g4() {
    return this.svc.enrollLead();
  }
  @Get("sc_5") async g5() {
    return this.svc.getCadenceAnalytics();
  }
}
