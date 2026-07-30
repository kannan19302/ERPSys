// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrComplianceSafetyDeepService } from "./hr-compliance-safety-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / compliance-safety-deep")
@ApiBearerAuth()
@Controller("hr-advanced/compliance-safety-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrComplianceSafetyDeepController {
  constructor(private readonly svc: HrComplianceSafetyDeepService) {}

  @Post("osha-incidents")
  @Permissions("hr.compliance.osha.create")
  @ApiOperation({ summary: "Log workplace safety incident on OSHA Form 300" })
  async logOshaIncident(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return { data: await this.svc.logOshaIncident(req.user.tenantId, body) };
  }

  @Get("osha-300-log")
  @Permissions("hr.compliance.osha.read")
  @ApiOperation({ summary: "Get OSHA 300 annual log summary report" })
  async getOsha300LogReport(
    @Req() req: AuthenticatedRequest,
    @Query("year") year?: string,
  ) {
    return {
      data: await this.svc.getOsha300LogReport(
        req.user.tenantId,
        year ? parseInt(year, 10) : 2026,
      ),
    };
  }

  @Get("eeo-1-report")
  @Permissions("hr.compliance.eeo.read")
  @ApiOperation({
    summary: "Get EEO-1 regulatory workforce demographic filing report",
  })
  async getEeo1RegulatoryReport(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getEeo1RegulatoryReport(req.user.tenantId) };
  }
}
