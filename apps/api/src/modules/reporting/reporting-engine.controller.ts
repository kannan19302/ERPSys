import { Controller, Get, Post, UseGuards, UseInterceptors, Req, Res } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ReportingEngineService } from './reporting-engine.service';
import { ExportService } from '../../common/services/export.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reporting/engine')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ReportingEngineController {
  constructor(
    private readonly engine: ReportingEngineService,
    private readonly exportService: ExportService,
  ) {}

  @ApiOperation({ summary: 'Handle request' })
  @Permissions('reporting.read')
  @Get('semantic-layer')
  getSemanticLayer() {
    return this.engine.getSemanticLayer();
  }

  @ApiOperation({ summary: 'Execute query' })
  @Permissions('reporting.create')
  @Post('query')
  async executeQuery(@Req() req: AuthReq, @ZodBody(z.any()) body: {
    entity: string;
    filters?: Record<string, unknown>;
    groupBy?: string[];
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    aggregations?: Array<{ field: string; fn: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' }>;
  }) {
    return this.engine.executeQuery(req.user.tenantId, body.entity, body);
  }

  @ApiOperation({ summary: 'Export query' })
  @Permissions('reporting.create')
  @Post('export')
  async exportQuery(@Req() req: AuthReq, @Res() res: Response, @ZodBody(z.any()) body: {
    entity: string;
    filters?: Record<string, unknown>;
    format: 'csv' | 'xlsx' | 'pdf';
    limit?: number;
  }) {
    const result = await this.engine.executeQuery(req.user.tenantId, body.entity, { filters: body.filters, limit: body.limit || 1000 });
    const semanticLayer = this.engine.getSemanticLayer();
    const entityDef = semanticLayer.find((e) => e.name === body.entity);
    const columns = (entityDef?.fields || []).map((f) => ({ header: f.label, key: f.name, width: 20 }));
    const filename = `${body.entity}_report_${new Date().toISOString().slice(0, 10)}`;

    if (body.format === 'csv') return this.exportService.exportCsv(res, filename, columns, result.data);
    if (body.format === 'xlsx') return this.exportService.exportXlsx(res, filename, columns, result.data);
    return this.exportService.exportPdf(res, filename, columns, result.data, `${entityDef?.label || body.entity} Report`);
  }
}
