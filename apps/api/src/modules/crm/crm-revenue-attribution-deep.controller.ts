// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmRevenueAttributionDeepService } from "./crm-revenue-attribution-deep.service";
@ApiTags("crm-revenue-attribution-deep")
@ApiBearerAuth()
@Controller("crm/revenue-attribution-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmRevenueAttributionDeepController {
  constructor(private readonly svc: CrmRevenueAttributionDeepService) {}
  @Get("ra_0") async g0() {
    return this.svc.getAttributionDashboard();
  }
  @Get("ra_1") async g1() {
    return this.svc.getTouchpoints();
  }
  @Get("ra_2") async g2() {
    return this.svc.createTouchpoint();
  }
  @Get("ra_3") async g3() {
    return this.svc.calculateAttribution();
  }
  @Get("ra_4") async g4() {
    return this.svc.getMultiTouchModels();
  }
}
