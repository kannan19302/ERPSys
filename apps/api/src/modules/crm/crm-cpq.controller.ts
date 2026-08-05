import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCpqService } from "./crm-cpq.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-cpq")
@ApiBearerAuth()
@Controller("crm/cpq")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCpqController {
  constructor(private readonly svc: CrmCpqService) {}
  @Permissions("crm.quote.read")
  @Get("cpq_0")
  async g0() {
    return this.svc.getQuotes();
  }
  @Permissions("crm.quote.create")
  @Get("cpq_1")
  async g1() {
    return this.svc.createQuote();
  }
  @Permissions("crm.quote.update")
  @Get("cpq_2")
  async g2() {
    return this.svc.updateQuote();
  }
  @Permissions("crm.quote.delete")
  @Get("cpq_3")
  async g3() {
    return this.svc.deleteQuote();
  }
  @Permissions("crm.rule.read")
  @Get("cpq_4")
  async g4() {
    return this.svc.getRules();
  }
}
