// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCommunicationDeepService } from "./crm-communication-deep.service";
@ApiTags("crm-communication-deep")
@ApiBearerAuth()
@Controller("crm/communication-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCommunicationDeepController {
  constructor(private readonly svc: CrmCommunicationDeepService) {}
  @Get("cmd_0") async g0() {
    return this.svc.getChannels();
  }
  @Get("cmd_1") async g1() {
    return this.svc.createChannel();
  }
  @Get("cmd_2") async g2() {
    return this.svc.getTemplates();
  }
  @Get("cmd_3") async g3() {
    return this.svc.sendCommunication();
  }
  @Get("cmd_4") async g4() {
    return this.svc.getCommunicationLogs();
  }
}
