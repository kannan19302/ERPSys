// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmEnterpriseTerritoryService } from "./crm-enterprise-territory.service";
@ApiTags("crm-enterprise-territory")
@ApiBearerAuth()
@Controller("crm/enterprise-territory")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmEnterpriseTerritoryController {
  constructor(private readonly svc: CrmEnterpriseTerritoryService) {}
  @Get("et_0") async g0() {
    return this.svc.getTerritories();
  }
  @Get("et_1") async g1() {
    return this.svc.createTerritory();
  }
  @Get("et_2") async g2() {
    return this.svc.updateTerritory();
  }
  @Get("et_3") async g3() {
    return this.svc.deleteTerritory();
  }
  @Get("et_4") async g4() {
    return this.svc.assignTerritory();
  }
}
