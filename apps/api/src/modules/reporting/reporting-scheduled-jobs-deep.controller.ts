import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportingScheduledJobsDeepService } from "./reporting-scheduled-jobs-deep.service";

@ApiTags("ReportingScheduledJobsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/scheduled-jobs-deep")
export class ReportingScheduledJobsDeepController {
  constructor(private readonly jobService: ReportingScheduledJobsDeepService) {}

  @ApiOperation({ summary: "Get scheduled report jobs" })
  @Permissions("reporting.jobs.read")
  @Get("jobs")
  async getJobs(@Req() req: any) {
    return this.jobService.getJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create scheduled report job" })
  @Permissions("reporting.jobs.create")
  @Post("jobs")
  async createJob(
    @Req() req: any,
    @Body()
    dto: {
      jobName: string;
      templateId: string;
      cronSchedule: string;
      outputFormat?: string;
      recipients?: any;
    },
  ) {
    return this.jobService.createJob(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Trigger manual report job execution" })
  @Permissions("reporting.jobs.update")
  @Post("jobs/:id/run")
  async executeJob(@Req() req: any, @Param("id") id: string) {
    return this.jobService.executeJob(id, req.user.tenantId);
  }
}
