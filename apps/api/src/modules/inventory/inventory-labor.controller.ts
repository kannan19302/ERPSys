import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryLaborService,
  createLaborStandardSchema,
  logTaskSchema,
  completeTaskSchema,
  createShiftTemplateSchema,
} from './inventory-labor.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-labor')
@Controller('inventory/labor')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryLaborController {
  constructor(private readonly service: InventoryLaborService) {}

  @Get('standards')
  @ApiOperation({ summary: 'List labor time standards' })
  listStandards(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.listLaborStandards(req.user.tenantId, warehouseId);
  }

  @Post('standards')
  @ApiOperation({ summary: 'Create a labor time standard' })
  createStandard(@Req() req: AuthReq, @ZodBody(createLaborStandardSchema) dto: any) {
    return this.service.createLaborStandard(req.user.tenantId, dto);
  }

  @Patch('standards/:id')
  @ApiOperation({ summary: 'Update a labor time standard' })
  updateStandard(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(createLaborStandardSchema.partial()) dto: any) {
    return this.service.updateLaborStandard(req.user.tenantId, id, dto);
  }

  @Delete('standards/:id')
  @ApiOperation({ summary: 'Deactivate a labor time standard' })
  deleteStandard(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.deleteLaborStandard(req.user.tenantId, id);
  }

  @Get('task-logs')
  @ApiOperation({ summary: 'List worker task logs' })
  listTaskLogs(
    @Req() req: AuthReq,
    @Query('workerId') workerId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('taskType') taskType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listTaskLogs(req.user.tenantId, {
      workerId,
      warehouseId,
      taskType,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('task-logs')
  @ApiOperation({ summary: 'Log a worker task (start + optional completion)' })
  logTask(@Req() req: AuthReq, @ZodBody(logTaskSchema) dto: any) {
    return this.service.logTask(req.user.tenantId, dto);
  }

  @Patch('task-logs/:id/complete')
  @ApiOperation({ summary: 'Mark a task log as completed' })
  completeTask(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(completeTaskSchema) dto: any) {
    return this.service.completeTask(req.user.tenantId, id, dto);
  }

  @Get('shift-templates')
  @ApiOperation({ summary: 'List warehouse shift templates' })
  listShiftTemplates(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.listShiftTemplates(req.user.tenantId, warehouseId);
  }

  @Post('shift-templates')
  @ApiOperation({ summary: 'Create a warehouse shift template' })
  createShiftTemplate(@Req() req: AuthReq, @ZodBody(createShiftTemplateSchema) dto: any) {
    return this.service.createShiftTemplate(req.user.tenantId, dto);
  }

  @Delete('shift-templates/:id')
  @ApiOperation({ summary: 'Deactivate a shift template' })
  deleteShiftTemplate(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.deleteShiftTemplate(req.user.tenantId, id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Labor productivity dashboard (7d)' })
  getDashboard(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.getLaborDashboard(req.user.tenantId, warehouseId);
  }

  @Get('workers/:workerId/productivity')
  @ApiOperation({ summary: 'Per-worker productivity report' })
  getWorkerProductivity(@Req() req: AuthReq, @Param('workerId') workerId: string, @Query('days') days?: string) {
    return this.service.getWorkerProductivity(req.user.tenantId, workerId, days ? parseInt(days) : 30);
  }
}
