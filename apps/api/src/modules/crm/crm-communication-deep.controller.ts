import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmCommunicationDeepService } from "./crm-communication-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-communication-deep")
@ApiBearerAuth()
@Controller("crm/communication-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCommunicationDeepController {
  constructor(private readonly svc: CrmCommunicationDeepService) {}
  @Permissions("crm.channel.read")
  @Get("cmd_0")
  async g0() {
    return this.svc.getChannels();
  }
  @Permissions("crm.channel.create")
  @Get("cmd_1")
  async g1() {
    return this.svc.createChannel();
  }
  @Permissions("crm.template.read")
  @Get("cmd_2")
  async g2() {
    return this.svc.getTemplates();
  }
  @Permissions("crm.communication.send")
  @Get("cmd_3")
  async g3() {
    return this.svc.sendCommunication();
  }
  @Permissions("crm.communication-log.read")
  @Get("cmd_4")
  async g4() {
    return this.svc.getCommunicationLogs();
  }
}
