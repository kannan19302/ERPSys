import { Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManufacturingExpansionService } from './manufacturing-expansion.service';
import { WorkCenterCapacitySchema, ManufacturingRouteSchema, QualityCheckTemplateSchema, QualityCheckSchema, ScrapRecordSchema, TimeEntrySchema } from './dto/manufacturing-expansion.dto';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('manufacturing-expansion')
@ApiBearerAuth()
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingExpansionController {
  constructor(private readonly service: ManufacturingExpansionService) {}

  // ── Work Center Capacity ──
  @ApiOperation({ summary: 'Get work center capacities' })
  @Get('work-centers/:workstationId/capacity')
  @Permissions('manufacturing.work-center-capacity.read')
  async getWorkCenterCapacities(@Req() req: AuthenticatedRequest, @Param('workstationId') workstationId: string) {
    return this.service.getWorkCenterCapacities(req.user.tenantId, workstationId);
  }

  @ApiOperation({ summary: 'Set work center capacity' })
  @Post('work-centers/capacity')
  @Permissions('manufacturing.work-center-capacity.update')
  async setWorkCenterCapacity(@Req() req: AuthenticatedRequest, @ZodBody(WorkCenterCapacitySchema) dto: unknown) {
    return this.service.setWorkCenterCapacity(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update work center capacity' })
  @Put('work-centers/capacity/:id')
  @Permissions('manufacturing.work-center-capacity.update')
  async updateWorkCenterCapacity(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(WorkCenterCapacitySchema.partial()) dto: unknown) {
    return this.service.updateWorkCenterCapacity(req.user.tenantId, id, dto as any);
  }

  // ── Routes ──
  @ApiOperation({ summary: 'Get manufacturing routes' })
  @Get('routes')
  @Permissions('manufacturing.route.read')
  async getRoutes(@Req() req: AuthenticatedRequest) {
    return this.service.getRoutes(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get route by id' })
  @Get('routes/:id')
  @Permissions('manufacturing.route.read')
  async getRouteById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getRouteById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create route' })
  @Post('routes')
  @Permissions('manufacturing.route.create')
  async createRoute(@Req() req: AuthenticatedRequest, @ZodBody(ManufacturingRouteSchema) dto: unknown) {
    return this.service.createRoute(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update route' })
  @Put('routes/:id')
  @Permissions('manufacturing.route.update')
  async updateRoute(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(ManufacturingRouteSchema.partial()) dto: unknown) {
    return this.service.updateRoute(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete route' })
  @Delete('routes/:id')
  @Permissions('manufacturing.route.delete')
  async deleteRoute(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteRoute(req.user.tenantId, id);
  }

  // ── Quality Check Templates ──
  @ApiOperation({ summary: 'Get quality check templates' })
  @Get('quality-templates')
  @Permissions('manufacturing.quality-template.read')
  async getQualityCheckTemplates(@Req() req: AuthenticatedRequest) {
    return this.service.getQualityCheckTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create quality check template' })
  @Post('quality-templates')
  @Permissions('manufacturing.quality-template.create')
  async createQualityCheckTemplate(@Req() req: AuthenticatedRequest, @ZodBody(QualityCheckTemplateSchema) dto: unknown) {
    return this.service.createQualityCheckTemplate(req.user.tenantId, dto as any);
  }

  // ── Quality Checks ──
  @ApiOperation({ summary: 'Get quality checks' })
  @Get('quality-checks')
  @Permissions('manufacturing.quality-check.read')
  async getQualityChecks(@Req() req: AuthenticatedRequest, @Query('workOrderId') workOrderId?: string) {
    return this.service.getQualityChecks(req.user.tenantId, workOrderId);
  }

  @ApiOperation({ summary: 'Perform quality check' })
  @Post('quality-checks')
  @Permissions('manufacturing.quality-check.create')
  async performQualityCheck(@Req() req: AuthenticatedRequest, @ZodBody(QualityCheckSchema) dto: unknown) {
    return this.service.performQualityCheck(req.user.tenantId, dto as any);
  }

  // ── Scrap Records ──
  @ApiOperation({ summary: 'Get scrap records' })
  @Get('scrap')
  @Permissions('manufacturing.scrap.read')
  async getScrapRecords(@Req() req: AuthenticatedRequest, @Query('workOrderId') workOrderId?: string) {
    return this.service.getScrapRecords(req.user.tenantId, workOrderId);
  }

  @ApiOperation({ summary: 'Create scrap record' })
  @Post('scrap')
  @Permissions('manufacturing.scrap.create')
  async createScrapRecord(@Req() req: AuthenticatedRequest, @ZodBody(ScrapRecordSchema) dto: unknown) {
    return this.service.createScrapRecord(req.user.tenantId, dto as any);
  }

  // ── Time Entries ──
  @ApiOperation({ summary: 'Get time entries' })
  @Get('time-entries')
  @Permissions('manufacturing.time-entry.read')
  async getTimeEntries(@Req() req: AuthenticatedRequest, @Query('workOrderId') workOrderId?: string, @Query('employeeId') employeeId?: string) {
    return this.service.getTimeEntries(req.user.tenantId, workOrderId, employeeId);
  }

  @ApiOperation({ summary: 'Create time entry' })
  @Post('time-entries')
  @Permissions('manufacturing.time-entry.create')
  async createTimeEntry(@Req() req: AuthenticatedRequest, @ZodBody(TimeEntrySchema) dto: unknown) {
    return this.service.createTimeEntry(req.user.tenantId, dto as any);
  }
}
