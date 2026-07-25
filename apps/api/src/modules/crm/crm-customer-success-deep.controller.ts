import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCustomerSuccessDeepService } from "./crm-customer-success-deep.service";
@ApiTags("crm-customer-success-deep")
@ApiBearerAuth()
@Controller("crm/customer-success-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCustomerSuccessDeepController {
  constructor(private readonly svc: CrmCustomerSuccessDeepService) {}
  @Get("csd_0") async g0() {
    return this.svc.getHealthProfiles();
  }
  @Get("csd_1") async g1() {
    return this.svc.createHealthProfile();
  }
  @Get("csd_2") async g2() {
    return this.svc.getRiskAlerts();
  }
  @Get("csd_3") async g3() {
    return this.svc.getNpsSurveys();
  }
}
