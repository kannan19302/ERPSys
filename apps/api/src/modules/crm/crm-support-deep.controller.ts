import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmSupportDeepService } from "./crm-support-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-support-deep")
@ApiBearerAuth()
@Controller("crm/support-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSupportDeepController {
  constructor(private readonly svc: CrmSupportDeepService) {}
  @Permissions("crm.support-dashboard.read")
  @Get("cs_0")
  async g0() {
    return this.svc.getSupportDashboard();
  }
  @Permissions("crm.help-center-article.read")
  @Get("cs_1")
  async g1() {
    return this.svc.getHelpCenterArticles();
  }
  @Permissions("crm.article-by-id.read")
  @Get("cs_2")
  async g2() {
    return this.svc.getArticleById();
  }
  @Permissions("crm.article.create")
  @Get("cs_3")
  async g3() {
    return this.svc.createArticle();
  }
  @Permissions("crm.article.update")
  @Get("cs_4")
  async g4() {
    return this.svc.updateArticle();
  }
  @Permissions("crm.article.delete")
  @Get("cs_5")
  async g5() {
    return this.svc.deleteArticle();
  }
  @Permissions("crm.ticket-macro.read")
  @Get("cs_6")
  async g6() {
    return this.svc.getTicketMacros();
  }
  @Permissions("crm.macro.create")
  @Get("cs_7")
  async g7() {
    return this.svc.createMacro();
  }
  @Permissions("crm.macro.update")
  @Get("cs_8")
  async g8() {
    return this.svc.updateMacro();
  }
  @Permissions("crm.macro.delete")
  @Get("cs_9")
  async g9() {
    return this.svc.deleteMacro();
  }
  @Permissions("crm.macro-on-ticket.execute")
  @Get("cs_10")
  async g10() {
    return this.svc.executeMacroOnTicket();
  }
  @Permissions("crm.escalation-rule.read")
  @Get("cs_11")
  async g11() {
    return this.svc.getEscalationRules();
  }
  @Permissions("crm.escalation-rule.create")
  @Get("cs_12")
  async g12() {
    return this.svc.createEscalationRule();
  }
  @Permissions("crm.escalation-rule.update")
  @Get("cs_13")
  async g13() {
    return this.svc.updateEscalationRule();
  }
  @Permissions("crm.escalation-rule.delete")
  @Get("cs_14")
  async g14() {
    return this.svc.deleteEscalationRule();
  }
  @Permissions("crm.ticket-escalation.trigger")
  @Get("cs_15")
  async g15() {
    return this.svc.triggerTicketEscalation();
  }
  @Permissions("crm.csat-survey.read")
  @Get("cs_16")
  async g16() {
    return this.svc.getCsatSurveys();
  }
  @Permissions("crm.csat-response.submit")
  @Get("cs_17")
  async g17() {
    return this.svc.submitCsatResponse();
  }
  @Permissions("crm.csat-analytics.read")
  @Get("cs_18")
  async g18() {
    return this.svc.getCsatAnalytics();
  }
  @Permissions("crm.live-chat-session.read")
  @Get("cs_19")
  async g19() {
    return this.svc.getLiveChatSessions();
  }
  @Permissions("crm.live-chat-session.create")
  @Get("cs_20")
  async g20() {
    return this.svc.createLiveChatSession();
  }
  @Permissions("crm.live-chat-session.end")
  @Get("cs_21")
  async g21() {
    return this.svc.endLiveChatSession();
  }
  @Permissions("crm.agent-performance.read")
  @Get("cs_22")
  async g22() {
    return this.svc.getAgentPerformance();
  }
  @Permissions("crm.agent-metrics.read")
  @Get("cs_23")
  async g23() {
    return this.svc.getAgentMetrics();
  }
  @Permissions("crm.support-deflection-report.read")
  @Get("cs_24")
  async g24() {
    return this.svc.getSupportDeflectionReport();
  }
}
