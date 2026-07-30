// @ts-nocheck
import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsEnterpriseService } from './projects-enterprise.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('projects-enterprise')
@ApiBearerAuth()
@Controller('projects/enterprise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectsEnterpriseController {
  constructor(private readonly service: ProjectsEnterpriseService) {}

  @ApiOperation({ summary: 'Portfolio health dashboard with schedule, budget, resource, risk scores' })
  @Get('portfolio-health/:portfolioId')
  @Permissions('projects.project.read')
  async getPortfolioHealth(@Req() req: AuthenticatedRequest, @Param('portfolioId') portfolioId: string) {
    return this.service.getPortfolioHealth(req.user.tenantId, portfolioId);
  }

  @ApiOperation({ summary: 'Resource capacity planning with supply/demand and overallocation alerts' })
  @Get('resource-capacity')
  @Permissions('projects.resource-allocation.read')
  async getResourceCapacityPlanning(
    @Req() req: AuthenticatedRequest,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.service.getResourceCapacityPlanning(req.user.tenantId, periodStart, periodEnd);
  }

  @ApiOperation({ summary: 'Earned value analysis with full EVM metrics' })
  @Get('earned-value/:projectId')
  @Permissions('projects.project.read')
  async getEarnedValueAnalysis(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Query('asOf') asOf: string,
  ) {
    return this.service.getEarnedValueAnalysis(req.user.tenantId, projectId, asOf);
  }

  @ApiOperation({ summary: 'Project profitability and margin analysis' })
  @Get('profitability/:projectId')
  @Permissions('projects.project.read')
  async getProjectProfitability(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getProjectProfitability(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Schedule risk assessment with Monte Carlo simulation' })
  @Get('schedule-risk/:projectId')
  @Permissions('projects.project.read')
  async getScheduleRiskAssessment(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getScheduleRiskAssessment(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Resource utilization rates by resource/project/department' })
  @Get('resource-utilization')
  @Permissions('projects.resource-allocation.read')
  async getResourceUtilization(
    @Req() req: AuthenticatedRequest,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.service.getResourceUtilization(req.user.tenantId, periodStart, periodEnd, groupBy);
  }

  @ApiOperation({ summary: 'Portfolio optimization under resource or budget constraints' })
  @Get('portfolio-optimization')
  @Permissions('projects.project.read')
  async getProjectPortfolioOptimization(
    @Req() req: AuthenticatedRequest,
    @Query('constraint') constraint?: string,
  ) {
    return this.service.getProjectPortfolioOptimization(req.user.tenantId, constraint || 'resource');
  }

  @ApiOperation({ summary: 'Milestone trending and slippage analysis' })
  @Get('milestone-trending/:projectId')
  @Permissions('projects.project.read')
  async getMilestoneTrending(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getMilestoneTrending(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Timesheet compliance and submission tracking' })
  @Get('timesheet-compliance/:projectId')
  @Permissions('projects.timesheet.read')
  async getTimesheetCompliance(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getTimesheetCompliance(req.user.tenantId, projectId, period || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Project financial forecast with EAC projections' })
  @Get('financial-forecast/:projectId')
  @Permissions('projects.project.read')
  async getProjectFinancialForecast(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getProjectFinancialForecast(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Project executive dashboard KPIs' })
  @Get('dashboard-kpis')
  @Permissions('projects.project.read')
  async getProjectDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getProjectDashboardKpis(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Task dependency network and critical chain analysis' })
  @Get('dependency-network/:projectId')
  @Permissions('projects.project.read')
  async getDependencyNetwork(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getDependencyNetwork(req.user.tenantId, projectId);
  }
}
