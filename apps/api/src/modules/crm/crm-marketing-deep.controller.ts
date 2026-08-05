import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmMarketingDeepService } from "./crm-marketing-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-marketing-deep")
@ApiBearerAuth()
@Controller("crm/marketing-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmMarketingDeepController {
  constructor(private readonly svc: CrmMarketingDeepService) {}
  @Permissions("crm.marketing-calendar.read")
  @Get("md_0")
  async g0() {
    return this.svc.getMarketingCalendar();
  }
  @Permissions("crm.marketing-calendar-entry.create")
  @Get("md_1")
  async g1() {
    return this.svc.createMarketingCalendarEntry();
  }
  @Permissions("crm.marketing-calendar-entry.update")
  @Get("md_2")
  async g2() {
    return this.svc.updateMarketingCalendarEntry();
  }
  @Permissions("crm.marketing-calendar-entry.delete")
  @Get("md_3")
  async g3() {
    return this.svc.deleteMarketingCalendarEntry();
  }
  @Permissions("crm.landing-page.read")
  @Get("md_4")
  async g4() {
    return this.svc.getLandingPages();
  }
  @Permissions("crm.landing-page.create")
  @Get("md_5")
  async g5() {
    return this.svc.createLandingPage();
  }
  @Permissions("crm.landing-page.update")
  @Get("md_6")
  async g6() {
    return this.svc.updateLandingPage();
  }
  @Permissions("crm.landing-page.delete")
  @Get("md_7")
  async g7() {
    return this.svc.deleteLandingPage();
  }
  @Permissions("crm.landing-page.publish")
  @Get("md_8")
  async g8() {
    return this.svc.publishLandingPage();
  }
  @Permissions("crm.landing-page-conversion.read")
  @Get("md_9")
  async g9() {
    return this.svc.getLandingPageConversions();
  }
  @Permissions("crm.form-submission.read")
  @Get("md_10")
  async g10() {
    return this.svc.getFormSubmissions();
  }
  @Permissions("crm.web-visitor.read")
  @Get("md_11")
  async g11() {
    return this.svc.getWebVisitors();
  }
  @Permissions("crm.visitor-analytics.read")
  @Get("md_12")
  async g12() {
    return this.svc.getVisitorAnalytics();
  }
  @Permissions("crm.marketing-roi-report.read")
  @Get("md_13")
  async g13() {
    return this.svc.getMarketingRoiReport();
  }
}
