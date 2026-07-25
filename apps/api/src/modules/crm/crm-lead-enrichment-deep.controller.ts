import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmLeadEnrichmentDeepService } from "./crm-lead-enrichment-deep.service";
@ApiTags("crm-lead-enrichment-deep")
@ApiBearerAuth()
@Controller("crm/lead-enrichment-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentDeepController {
  constructor(private readonly svc: CrmLeadEnrichmentDeepService) {}
  @Get("le_0") async g0() {
    return this.svc.getSources();
  }
  @Get("le_1") async g1() {
    return this.svc.createSource();
  }
  @Get("le_2") async g2() {
    return this.svc.updateSource();
  }
  @Get("le_3") async g3() {
    return this.svc.enrichLead();
  }
  @Get("le_4") async g4() {
    return this.svc.getEnrichmentLogs();
  }
  @Get("le_5") async g5() {
    return this.svc.getEnrichmentJobs();
  }
  @Get("le_6") async g6() {
    return this.svc.createJob();
  }
  @Get("le_7") async g7() {
    return this.svc.getJobById();
  }
}
