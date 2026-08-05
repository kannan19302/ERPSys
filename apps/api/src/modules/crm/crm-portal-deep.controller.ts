import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPortalDeepService } from "./crm-portal-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-portal-deep")
@ApiBearerAuth()
@Controller("crm/portal-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPortalDeepController {
  constructor(private readonly svc: CrmPortalDeepService) {}
  @Permissions("crm.portal-customization.read")
  @Get("pd_0")
  async g0() {
    return this.svc.getPortalCustomization();
  }
  @Permissions("crm.portal-customization.update")
  @Get("pd_1")
  async g1() {
    return this.svc.updatePortalCustomization();
  }
  @Permissions("crm.portal-document.read")
  @Get("pd_2")
  async g2() {
    return this.svc.getPortalDocuments();
  }
  @Permissions("crm.portal-document.upload")
  @Get("pd_3")
  async g3() {
    return this.svc.uploadPortalDocument();
  }
  @Permissions("crm.portal-document.delete")
  @Get("pd_4")
  async g4() {
    return this.svc.deletePortalDocument();
  }
  @Permissions("crm.portal-notification.read")
  @Get("pd_5")
  async g5() {
    return this.svc.getPortalNotifications();
  }
  @Permissions("crm.notification-a-read.mark")
  @Get("pd_6")
  async g6() {
    return this.svc.markNotificationAsRead();
  }
  @Permissions("crm.forum-topics.read")
  @Get("pd_7")
  async g7() {
    return this.svc.getForumTopics();
  }
  @Permissions("crm.forum-topic.create")
  @Get("pd_8")
  async g8() {
    return this.svc.createForumTopic();
  }
  @Permissions("crm.forum-topic-by-id.read")
  @Get("pd_9")
  async g9() {
    return this.svc.getForumTopicById();
  }
  @Permissions("crm.forum-reply.create")
  @Get("pd_10")
  async g10() {
    return this.svc.createForumReply();
  }
  @Permissions("crm.forum-topic.upvote")
  @Get("pd_11")
  async g11() {
    return this.svc.upvoteForumTopic();
  }
  @Permissions("crm.forum-reply.upvote")
  @Get("pd_12")
  async g12() {
    return this.svc.upvoteForumReply();
  }
  @Permissions("crm.portal-analytics-overview.read")
  @Get("pd_13")
  async g13() {
    return this.svc.getPortalAnalyticsOverview();
  }
  @Permissions("crm.portal-content.read")
  @Get("pd_14")
  async g14() {
    return this.svc.searchPortalContent();
  }
}
