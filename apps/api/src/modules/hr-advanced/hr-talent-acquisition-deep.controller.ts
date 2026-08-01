import {
  Controller,
  Get,
  Post,
  Param,
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
import { HrTalentAcquisitionDeepService } from "./hr-talent-acquisition-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / talent-acquisition-deep")
@ApiBearerAuth()
@Controller("hr-advanced/talent-acquisition-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrTalentAcquisitionDeepController {
  constructor(private readonly svc: HrTalentAcquisitionDeepService) {}

  @Post("requisitions")
  @Permissions("hr.ats.requisition.create")
  @ApiOperation({
    summary: "Create job requisition with headcount approval routing",
  })
  async createJobRequisition(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      jobTitle: string;
      department: string;
      location?: string;
      targetSalaryMin: number;
      targetSalaryMax: number;
      openHeadcountCount?: number;
    },
  ) {
    return {
      data: await this.svc.createJobRequisition(req.user.tenantId, body),
    };
  }

  @Get("requisitions")
  @Permissions("hr.ats.requisition.read")
  @ApiOperation({ summary: "Get open job requisitions" })
  async getJobRequisitions(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getJobRequisitions(req.user.tenantId) };
  }

  @Post("offer-letters")
  @Permissions("hr.ats.offer.create")
  @ApiOperation({
    summary: "Generate executive candidate offer letter for e-signature",
  })
  async generateOfferLetter(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      candidateName: string;
      candidateEmail: string;
      jobTitle: string;
      baseSalary: number;
      signOnBonus?: number;
      startDate: string;
    },
  ) {
    return {
      data: await this.svc.generateOfferLetter(req.user.tenantId, body),
    };
  }

  @Get("candidate-match/:candidateId")
  @Permissions("hr.ats.match.read")
  @ApiOperation({
    summary: "Get AI candidate resume match score and skills calibration",
  })
  async getCandidateAiMatchScore(
    @Req() req: AuthenticatedRequest,
    @Param("candidateId") candidateId: string,
    @Query("requisitionId") requisitionId: string,
  ) {
    return {
      data: await this.svc.getCandidateAiMatchScore(
        req.user.tenantId,
        candidateId,
        requisitionId,
      ),
    };
  }

  @Get("funnel-analytics")
  @Permissions("hr.ats.funnel.read")
  @ApiOperation({
    summary:
      "Get recruitment pipeline funnel analytics and time-to-hire metrics",
  })
  async getRecruitmentFunnelAnalytics(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRecruitmentFunnelAnalytics(req.user.tenantId),
    };
  }
}
