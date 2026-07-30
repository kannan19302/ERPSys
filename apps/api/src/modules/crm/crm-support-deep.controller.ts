// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmSupportDeepService } from "./crm-support-deep.service";
@ApiTags("crm-support-deep")
@ApiBearerAuth()
@Controller("crm/support-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSupportDeepController {
  constructor(private readonly svc: CrmSupportDeepService) {}
  @Get("cs_0") async g0() {
    return this.svc.getSupportDashboard();
  }
  @Get("cs_1") async g1() {
    return this.svc.getHelpCenterArticles();
  }
  @Get("cs_2") async g2() {
    return this.svc.getArticleById();
  }
  @Get("cs_3") async g3() {
    return this.svc.createArticle();
  }
  @Get("cs_4") async g4() {
    return this.svc.updateArticle();
  }
  @Get("cs_5") async g5() {
    return this.svc.deleteArticle();
  }
  @Get("cs_6") async g6() {
    return this.svc.getTicketMacros();
  }
  @Get("cs_7") async g7() {
    return this.svc.createMacro();
  }
  @Get("cs_8") async g8() {
    return this.svc.updateMacro();
  }
  @Get("cs_9") async g9() {
    return this.svc.deleteMacro();
  }
  @Get("cs_10") async g10() {
    return this.svc.executeMacroOnTicket();
  }
  @Get("cs_11") async g11() {
    return this.svc.getEscalationRules();
  }
  @Get("cs_12") async g12() {
    return this.svc.createEscalationRule();
  }
  @Get("cs_13") async g13() {
    return this.svc.updateEscalationRule();
  }
  @Get("cs_14") async g14() {
    return this.svc.deleteEscalationRule();
  }
  @Get("cs_15") async g15() {
    return this.svc.triggerTicketEscalation();
  }
  @Get("cs_16") async g16() {
    return this.svc.getCsatSurveys();
  }
  @Get("cs_17") async g17() {
    return this.svc.submitCsatResponse();
  }
  @Get("cs_18") async g18() {
    return this.svc.getCsatAnalytics();
  }
  @Get("cs_19") async g19() {
    return this.svc.getLiveChatSessions();
  }
  @Get("cs_20") async g20() {
    return this.svc.createLiveChatSession();
  }
  @Get("cs_21") async g21() {
    return this.svc.endLiveChatSession();
  }
  @Get("cs_22") async g22() {
    return this.svc.getAgentPerformance();
  }
  @Get("cs_23") async g23() {
    return this.svc.getAgentMetrics();
  }
  @Get("cs_24") async g24() {
    return this.svc.getSupportDeflectionReport();
  }
}
