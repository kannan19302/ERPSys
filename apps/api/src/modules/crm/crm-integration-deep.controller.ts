// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmIntegrationDeepService } from "./crm-integration-deep.service";
@ApiTags("crm-integration-deep")
@ApiBearerAuth()
@Controller("crm/integration-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmIntegrationDeepController {
  constructor(private readonly svc: CrmIntegrationDeepService) {}
  @Get("id_0") async g0() {
    return this.svc.getWebhookConfigs();
  }
  @Get("id_1") async g1() {
    return this.svc.createConfig();
  }
  @Get("id_2") async g2() {
    return this.svc.updateConfig();
  }
  @Get("id_3") async g3() {
    return this.svc.deleteConfig();
  }
  @Get("id_4") async g4() {
    return this.svc.getWebhookLogs();
  }
  @Get("id_5") async g5() {
    return this.svc.getWebhookDeliveryStats();
  }
  @Get("id_6") async g6() {
    return this.svc.testWebhook();
  }
  @Get("id_7") async g7() {
    return this.svc.getCalendarConnections();
  }
  @Get("id_8") async g8() {
    return this.svc.createConnection();
  }
  @Get("id_9") async g9() {
    return this.svc.updateConnection();
  }
  @Get("id_10") async g10() {
    return this.svc.deleteConnection();
  }
  @Get("id_11") async g11() {
    return this.svc.syncCalendar();
  }
  @Get("id_12") async g12() {
    return this.svc.getSlackConnections();
  }
  @Get("id_13") async g13() {
    return this.svc.createSlackConnection();
  }
  @Get("id_14") async g14() {
    return this.svc.updateSlackConnection();
  }
  @Get("id_15") async g15() {
    return this.svc.deleteSlackConnection();
  }
  @Get("id_16") async g16() {
    return this.svc.sendSlackNotification();
  }
  @Get("id_17") async g17() {
    return this.svc.getIntegrationDashboard();
  }
  @Get("id_18") async g18() {
    return this.svc.getEventDeliveryLogs();
  }
  @Get("id_19") async g19() {
    return this.svc.getEventDeliveryStats();
  }
  @Get("id_20") async g20() {
    return this.svc.retryFailedDelivery();
  }
}
