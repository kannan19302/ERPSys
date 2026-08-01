import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { EducationEnterpriseService } from "./education-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("education/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EducationEnterpriseController {
  constructor(private readonly service: EducationEnterpriseService) {}

  @Get("student-performance")
  @Permissions("education.enterprise.read")
  async getStudentPerformance(
    @Req() req: AuthenticatedRequest,
    @Query("academicYear") academicYear?: string,
  ) {
    return this.service.getStudentPerformanceAnalytics(
      req.user.tenantId,
      academicYear,
    );
  }

  @Get("enrollment-forecasting")
  @Permissions("education.enterprise.read")
  async getEnrollmentForecasting(
    @Req() req: AuthenticatedRequest,
    @Query("horizon") horizon?: string,
  ) {
    return this.service.getEnrollmentForecasting(req.user.tenantId, horizon);
  }

  @Get("faculty-workload")
  @Permissions("education.enterprise.read")
  async getFacultyWorkload(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.service.getFacultyWorkload(req.user.tenantId, period);
  }

  @Get("financial-aid")
  @Permissions("education.enterprise.read")
  async getFinancialAid(
    @Req() req: AuthenticatedRequest,
    @Query("academicYear") academicYear?: string,
  ) {
    return this.service.getFinancialAidAnalytics(
      req.user.tenantId,
      academicYear,
    );
  }

  @Get("institutional-effectiveness")
  @Permissions("education.enterprise.read")
  async getInstitutionalEffectiveness(
    @Req() req: AuthenticatedRequest,
    @Query("academicYear") academicYear?: string,
  ) {
    return this.service.getInstitutionalEffectiveness(
      req.user.tenantId,
      academicYear,
    );
  }

  @Get("campus-operations")
  @Permissions("education.enterprise.read")
  async getCampusOperations(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.service.getCampusOperations(req.user.tenantId, period);
  }

  @Get("program-profitability")
  @Permissions("education.enterprise.read")
  async getProgramProfitability(
    @Req() req: AuthenticatedRequest,
    @Query("academicYear") academicYear?: string,
  ) {
    return this.service.getProgramProfitability(
      req.user.tenantId,
      academicYear,
    );
  }

  @Get("accreditation-compliance")
  @Permissions("education.enterprise.read")
  async getAccreditationCompliance(@Req() req: AuthenticatedRequest) {
    return this.service.getAccreditationCompliance(req.user.tenantId);
  }

  @Get("dashboard-kpis")
  @Permissions("education.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getEducationDashboardKpis(req.user.tenantId);
  }
}
