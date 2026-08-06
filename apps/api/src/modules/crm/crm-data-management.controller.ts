import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmDataManagementService } from "./crm-data-management.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-data-management")
@ApiBearerAuth()
@Controller("crm/data-management")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDataManagementController {
  constructor(private readonly svc: CrmDataManagementService) {}
  @Permissions("crm.deduplication-job.read")
  @Get("dm_0")
  async g0() {
    return this.svc.getDeduplicationJobs();
  }
  @Permissions("crm.job.create")
  @Get("dm_1")
  async g1() {
    return this.svc.createJob();
  }
  @Permissions("crm.record.merge")
  @Get("dm_2")
  async g2() {
    return this.svc.mergeRecords();
  }
  @Permissions("crm.export-history.read")
  @Get("dm_3")
  async g3() {
    return this.svc.getExportHistory();
  }
}
