// @ts-nocheck
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
import { ReportingComplianceSignoffDeepService } from "./reporting-compliance-signoff-deep.service";

@ApiTags("ReportingComplianceSignoffDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/compliance-signoff-deep")
export class ReportingComplianceSignoffDeepController {
  constructor(
    private readonly complianceService: ReportingComplianceSignoffDeepService,
  ) {}

  @ApiOperation({ summary: "Get compliance audits" })
  @Permissions("reporting.compliance.read")
  @Get("audits")
  async getComplianceAudits(@Req() req: any) {
    return this.complianceService.getComplianceAudits(req.user.tenantId);
  }

  @ApiOperation({ summary: "Initiate compliance report audit" })
  @Permissions("reporting.compliance.create")
  @Post("audits")
  async initiateAudit(
    @Req() req: any,
    @Body() dto: { reportName: string; complianceType: string },
  ) {
    return this.complianceService.initiateAudit(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Sign off on compliance report" })
  @Permissions("reporting.compliance.update")
  @Post("audits/:id/signoff")
  async signoffAudit(
    @Req() req: any,
    @Param("id") auditId: string,
    @Body() dto: { signatureHash: string; comments?: string },
  ) {
    return this.complianceService.signoffAudit(auditId, req.user.userId, dto);
  }
}
