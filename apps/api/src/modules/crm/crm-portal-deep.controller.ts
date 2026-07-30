// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPortalDeepService } from "./crm-portal-deep.service";
@ApiTags("crm-portal-deep")
@ApiBearerAuth()
@Controller("crm/portal-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPortalDeepController {
  constructor(private readonly svc: CrmPortalDeepService) {}
  @Get("pd_0") async g0() {
    return this.svc.getPortalCustomization();
  }
  @Get("pd_1") async g1() {
    return this.svc.updatePortalCustomization();
  }
  @Get("pd_2") async g2() {
    return this.svc.getPortalDocuments();
  }
  @Get("pd_3") async g3() {
    return this.svc.uploadPortalDocument();
  }
  @Get("pd_4") async g4() {
    return this.svc.deletePortalDocument();
  }
  @Get("pd_5") async g5() {
    return this.svc.getPortalNotifications();
  }
  @Get("pd_6") async g6() {
    return this.svc.markNotificationAsRead();
  }
  @Get("pd_7") async g7() {
    return this.svc.getForumTopics();
  }
  @Get("pd_8") async g8() {
    return this.svc.createForumTopic();
  }
  @Get("pd_9") async g9() {
    return this.svc.getForumTopicById();
  }
  @Get("pd_10") async g10() {
    return this.svc.createForumReply();
  }
  @Get("pd_11") async g11() {
    return this.svc.upvoteForumTopic();
  }
  @Get("pd_12") async g12() {
    return this.svc.upvoteForumReply();
  }
  @Get("pd_13") async g13() {
    return this.svc.getPortalAnalyticsOverview();
  }
  @Get("pd_14") async g14() {
    return this.svc.searchPortalContent();
  }
}
