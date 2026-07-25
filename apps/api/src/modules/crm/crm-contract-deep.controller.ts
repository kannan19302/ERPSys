import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmContractDeepService } from "./crm-contract-deep.service";
@ApiTags("crm-contract-deep")
@ApiBearerAuth()
@Controller("crm/contract-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractDeepController {
  constructor(private readonly svc: CrmContractDeepService) {}
  @Get("cd_0") async g0() {
    return this.svc.getContracts();
  }
  @Get("cd_1") async g1() {
    return this.svc.createContract();
  }
  @Get("cd_2") async g2() {
    return this.svc.updateContract();
  }
  @Get("cd_3") async g3() {
    return this.svc.deleteContract();
  }
  @Get("cd_4") async g4() {
    return this.svc.getObligations();
  }
}
