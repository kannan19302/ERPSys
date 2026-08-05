import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCoachingDeepService } from "./crm-coaching-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-coaching-deep")
@ApiBearerAuth()
@Controller("crm/coaching-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCoachingDeepController {
  constructor(private readonly svc: CrmCoachingDeepService) {}
  @Permissions("crm.coaching-program.read")
  @Get("ccd_0")
  async g0() {
    return this.svc.getCoachingPrograms();
  }
  @Permissions("crm.coaching-program.create")
  @Get("ccd_1")
  async g1() {
    return this.svc.createCoachingProgram();
  }
  @Permissions("crm.coaching-session.read")
  @Get("ccd_2")
  async g2() {
    return this.svc.getCoachingSessions();
  }
  @Permissions("crm.coaching-feedback.read")
  @Get("ccd_3")
  async g3() {
    return this.svc.getCoachingFeedback();
  }
}
