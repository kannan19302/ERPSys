import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmIntegrationDeepService } from "./crm-integration-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-integration-deep")
@ApiBearerAuth()
@Controller("crm/integration-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmIntegrationDeepController {
  constructor(private readonly svc: CrmIntegrationDeepService) {}
  @Permissions("crm.webhook-config.read")
  @Get("id_0")
  async g0() {
    return this.svc.getWebhookConfigs();
  }
  @Permissions("crm.config.create")
  @Get("id_1")
  async g1() {
    return this.svc.createConfig();
  }
  @Permissions("crm.config.update")
  @Get("id_2")
  async g2() {
    return this.svc.updateConfig();
  }
  @Permissions("crm.config.delete")
  @Get("id_3")
  async g3() {
    return this.svc.deleteConfig();
  }
  @Permissions("crm.webhook-log.read")
  @Get("id_4")
  async g4() {
    return this.svc.getWebhookLogs();
  }
  @Permissions("crm.webhook-delivery-stat.read")
  @Get("id_5")
  async g5() {
    return this.svc.getWebhookDeliveryStats();
  }
  @Permissions("crm.webhook.test")
  @Get("id_6")
  async g6() {
    return this.svc.testWebhook();
  }
  @Permissions("crm.calendar-connection.read")
  @Get("id_7")
  async g7() {
    return this.svc.getCalendarConnections();
  }
  @Permissions("crm.connection.create")
  @Get("id_8")
  async g8() {
    return this.svc.createConnection();
  }
  @Permissions("crm.connection.update")
  @Get("id_9")
  async g9() {
    return this.svc.updateConnection();
  }
  @Permissions("crm.connection.delete")
  @Get("id_10")
  async g10() {
    return this.svc.deleteConnection();
  }
  @Permissions("crm.calendar.sync")
  @Get("id_11")
  async g11() {
    return this.svc.syncCalendar();
  }
  @Permissions("crm.slack-connection.read")
  @Get("id_12")
  async g12() {
    return this.svc.getSlackConnections();
  }
  @Permissions("crm.slack-connection.create")
  @Get("id_13")
  async g13() {
    return this.svc.createSlackConnection();
  }
  @Permissions("crm.slack-connection.update")
  @Get("id_14")
  async g14() {
    return this.svc.updateSlackConnection();
  }
  @Permissions("crm.slack-connection.delete")
  @Get("id_15")
  async g15() {
    return this.svc.deleteSlackConnection();
  }
  @Permissions("crm.slack-notification.send")
  @Get("id_16")
  async g16() {
    return this.svc.sendSlackNotification();
  }
  @Permissions("crm.integration-dashboard.read")
  @Get("id_17")
  async g17() {
    return this.svc.getIntegrationDashboard();
  }
  @Permissions("crm.event-delivery-log.read")
  @Get("id_18")
  async g18() {
    return this.svc.getEventDeliveryLogs();
  }
  @Permissions("crm.event-delivery-stat.read")
  @Get("id_19")
  async g19() {
    return this.svc.getEventDeliveryStats();
  }
  @Permissions("crm.failed-delivery.retry")
  @Get("id_20")
  async g20() {
    return this.svc.retryFailedDelivery();
  }
}
