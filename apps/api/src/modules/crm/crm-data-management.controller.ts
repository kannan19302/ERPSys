import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmDataManagementService } from "./crm-data-management.service";
@ApiTags("crm-data-management")
@ApiBearerAuth()
@Controller("crm/data-management")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDataManagementController {
  constructor(private readonly svc: CrmDataManagementService) {}
  @Get("dm_0") async g0() {
    return this.svc.getDeduplicationJobs();
  }
  @Get("dm_1") async g1() {
    return this.svc.createJob();
  }
  @Get("dm_2") async g2() {
    return this.svc.mergeRecords();
  }
  @Get("dm_3") async g3() {
    return this.svc.getExportHistory();
  }
}
