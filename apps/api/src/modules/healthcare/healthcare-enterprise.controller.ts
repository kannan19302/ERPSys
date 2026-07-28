import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HealthcareEnterpriseService } from "./healthcare-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("healthcare/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthcareEnterpriseController {
  constructor(private readonly service: HealthcareEnterpriseService) {}

  @Get("clinical-outcomes")
  @Permissions("healthcare.enterprise.read")
  async getClinicalOutcomes(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getClinicalOutcomes(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("patient-demographics")
  @Permissions("healthcare.enterprise.read")
  async getPatientDemographics(@Req() req: AuthenticatedRequest) {
    return this.service.getPatientDemographics(req.user.tenantId);
  }

  @Get("revenue-cycle")
  @Permissions("healthcare.enterprise.read")
  async getRevenueCycleAnalytics(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getRevenueCycleAnalytics(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("population-health")
  @Permissions("healthcare.enterprise.read")
  async getPopulationHealth(@Req() req: AuthenticatedRequest, @Query("criteria") criteria?: string) {
    return this.service.getPopulationHealth(req.user.tenantId, criteria ? JSON.parse(criteria) : undefined);
  }

  @Get("pharmacy-analytics")
  @Permissions("healthcare.enterprise.read")
  async getPharmacyAnalytics(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getPharmacyAnalytics(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("operational-metrics")
  @Permissions("healthcare.enterprise.read")
  async getOperationalMetrics(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getOperationalMetrics(req.user.tenantId, dateRange);
  }

  @Get("compliance-audit")
  @Permissions("healthcare.enterprise.read")
  async getComplianceAudit(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getComplianceAudit(req.user.tenantId, dateRange);
  }

  @Get("patient-satisfaction")
  @Permissions("healthcare.enterprise.read")
  async getPatientSatisfaction(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getPatientSatisfaction(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("dashboard-kpis")
  @Permissions("healthcare.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getHealthDashboardKpis(req.user.tenantId);
  }
}
