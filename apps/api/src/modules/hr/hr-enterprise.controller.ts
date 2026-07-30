// @ts-nocheck
import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HrEnterpriseService } from './hr-enterprise.service';

@Controller('hr/enterprise')
@UseGuards(TenantGuard, RbacGuard)
export class HrEnterpriseController {
  constructor(private readonly service: HrEnterpriseService) {}

  @Get('headcount-analytics')
  @Permissions('hr.employee.read')
  async getHeadcountAnalytics(@Req() req: any, @Query('dateRange') dateRange?: string, @Query('groupBy') groupBy?: string) {
    return this.service.getHeadcountAnalytics(req.tenantId, dateRange, groupBy);
  }

  @Get('demographics')
  @Permissions('hr.employee.read')
  async getWorkforceDemographics(@Req() req: any) {
    return this.service.getWorkforceDemographics(req.tenantId);
  }

  @Get('compensation-analysis')
  @Permissions('hr.employee.read')
  async getCompensationAnalysis(@Req() req: any, @Query('departmentId') departmentId?: string) {
    return this.service.getCompensationAnalysis(req.tenantId, departmentId);
  }

  @Get('turnover-analysis')
  @Permissions('hr.employee.read')
  async getTurnoverAnalysis(@Req() req: any, @Query('dateRange') dateRange?: string, @Query('groupBy') groupBy?: string) {
    return this.service.getTurnoverAnalysis(req.tenantId, dateRange, groupBy);
  }

  @Get('payroll-analytics')
  @Permissions('hr.payroll.read')
  async getPayrollAnalytics(@Req() req: any, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getPayrollAnalytics(req.tenantId, periodStart, periodEnd);
  }

  @Get('dashboard-kpis')
  @Permissions('hr.employee.read')
  async getHrExecutiveDashboard(@Req() req: any) {
    return this.service.getHrExecutiveDashboard(req.tenantId);
  }

  @Get('talent-pipeline')
  @Permissions('hr.employee.read')
  async getTalentPipeline(@Req() req: any) {
    return this.service.getTalentPipeline(req.tenantId);
  }

  @Get('succession-readiness')
  @Permissions('hr.employee.read')
  async getSuccessionReadiness(@Req() req: any, @Query('departmentId') departmentId?: string) {
    return this.service.getSuccessionReadiness(req.tenantId, departmentId);
  }

  @Get('export/:reportType')
  @Permissions('hr.employee.read')
  async exportHrReport(@Req() req: any, @Param('reportType') reportType: string, @Query('format') format: string, @Query() params: any) {
    return this.service.exportHrReport(req.tenantId, reportType, format || 'json', params);
  }
}
