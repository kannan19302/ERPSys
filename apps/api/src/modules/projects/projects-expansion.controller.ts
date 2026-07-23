import { Controller, Get, Post, Put, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsExpansionService } from './projects-expansion.service';
import { PortfolioMemberSchema, RiskMitigationSchema, ResourceAllocationSchema, BudgetLineSchema, ProjectDocumentSchema } from './dto/projects-expansion.dto';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('projects-expansion')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectsExpansionController {
  constructor(private readonly service: ProjectsExpansionService) {}

  // ── Portfolio Members ──
  @ApiOperation({ summary: 'Get portfolio members' })
  @Get('portfolios/:portfolioId/members')
  @Permissions('projects.portfolio-member.read')
  async getPortfolioMembers(@Req() req: AuthenticatedRequest, @Param('portfolioId') portfolioId: string) {
    return this.service.getPortfolioMembers(req.user.tenantId, portfolioId);
  }

  @ApiOperation({ summary: 'Add portfolio member' })
  @Post('portfolios/:portfolioId/members')
  @Permissions('projects.portfolio-member.create')
  async addPortfolioMember(@Req() req: AuthenticatedRequest, @Param('portfolioId') portfolioId: string, @ZodBody(PortfolioMemberSchema) dto: unknown) {
    return this.service.addPortfolioMember(req.user.tenantId, portfolioId, dto as any);
  }

  @ApiOperation({ summary: 'Remove portfolio member' })
  @Delete('portfolio-members/:memberId')
  @Permissions('projects.portfolio-member.delete')
  async removePortfolioMember(@Req() req: AuthenticatedRequest, @Param('memberId') memberId: string) {
    return this.service.removePortfolioMember(req.user.tenantId, memberId);
  }

  // ── Risk Mitigations ──
  @ApiOperation({ summary: 'Get risk mitigations' })
  @Get('risks/:riskId/mitigations')
  @Permissions('projects.risk-mitigation.read')
  async getRiskMitigations(@Req() req: AuthenticatedRequest, @Param('riskId') riskId: string) {
    return this.service.getRiskMitigations(req.user.tenantId, riskId);
  }

  @ApiOperation({ summary: 'Create risk mitigation' })
  @Post('risk-mitigations')
  @Permissions('projects.risk-mitigation.create')
  async createRiskMitigation(@Req() req: AuthenticatedRequest, @ZodBody(RiskMitigationSchema) dto: unknown) {
    return this.service.createRiskMitigation(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update risk mitigation' })
  @Put('risk-mitigations/:id')
  @Permissions('projects.project.update')
  async updateRiskMitigation(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(RiskMitigationSchema.partial()) dto: unknown) {
    return this.service.updateRiskMitigation(req.user.tenantId, id, dto as any);
  }

  // ── Resource Allocations ──
  @ApiOperation({ summary: 'Get resource allocations' })
  @Get(':projectId/resource-allocations')
  @Permissions('projects.resource-allocation.read')
  async getResourceAllocations(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getResourceAllocations(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Create resource allocation' })
  @Post('resource-allocations')
  @Permissions('projects.resource-allocation.create')
  async createResourceAllocation(@Req() req: AuthenticatedRequest, @ZodBody(ResourceAllocationSchema) dto: unknown) {
    return this.service.createResourceAllocation(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update resource allocation' })
  @Put('resource-allocations/:id')
  @Permissions('projects.resource-allocation.update')
  async updateResourceAllocation(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(ResourceAllocationSchema.partial()) dto: unknown) {
    return this.service.updateResourceAllocation(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete resource allocation' })
  @Delete('resource-allocations/:id')
  @Permissions('projects.resource-allocation.delete')
  async deleteResourceAllocation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteResourceAllocation(req.user.tenantId, id);
  }

  // ── Budget Lines ──
  @ApiOperation({ summary: 'Get budget lines' })
  @Get(':projectId/budget-lines')
  @Permissions('projects.budget-line.read')
  async getBudgetLines(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getBudgetLines(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Create budget line' })
  @Post('budget-lines')
  @Permissions('projects.budget-line.create')
  async createBudgetLine(@Req() req: AuthenticatedRequest, @ZodBody(BudgetLineSchema) dto: unknown) {
    return this.service.createBudgetLine(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update budget line' })
  @Put('budget-lines/:id')
  @Permissions('projects.budget-line.update')
  async updateBudgetLine(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(BudgetLineSchema.partial()) dto: unknown) {
    return this.service.updateBudgetLine(req.user.tenantId, id, dto as any);
  }

  // ── Documents ──
  @ApiOperation({ summary: 'Get project documents' })
  @Get(':projectId/documents')
  @Permissions('projects.document.read')
  async getDocuments(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getDocuments(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Upload document' })
  @Post('documents')
  @Permissions('projects.document.create')
  async createDocument(@Req() req: AuthenticatedRequest, @ZodBody(ProjectDocumentSchema) dto: unknown) {
    return this.service.createDocument(req.user.tenantId, dto as any, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete document' })
  @Delete('documents/:id')
  @Permissions('projects.document.delete')
  async deleteDocument(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteDocument(req.user.tenantId, id);
  }

  // ── Activity Log ──
  @ApiOperation({ summary: 'Get project activity log' })
  @Get(':projectId/activity')
  @Permissions('projects.activity.read')
  async getActivityLog(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    return this.service.getActivityLog(req.user.tenantId, projectId);
  }
}
