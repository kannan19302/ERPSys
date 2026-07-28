import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { EducationAcademicService } from "./education-academic.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
  };
}

@Controller("education")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EducationAcademicController {
  constructor(private readonly service: EducationAcademicService) {}

  @Get("report-cards")
  @Permissions("education.report-cards.read")
  async getReportCards(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getReportCards(req.user.tenantId, query);
  }

  @Post("report-cards")
  @Permissions("education.report-cards.create")
  async createReportCard(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createReportCard(req.user.tenantId, body);
  }

  @Get("scholarships")
  @Permissions("education.scholarships.read")
  async getScholarships(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getScholarships(req.user.tenantId, query);
  }

  @Post("scholarships")
  @Permissions("education.scholarships.create")
  async createScholarship(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createScholarship(req.user.tenantId, body);
  }

  @Get("submissions")
  @Permissions("education.submissions.read")
  async getSubmissions(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getSubmissions(req.user.tenantId, query);
  }

  @Post("submissions")
  @Permissions("education.submissions.create")
  async submitAssignment(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.submitAssignment(req.user.tenantId, body);
  }
}
