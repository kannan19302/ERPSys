import { Controller, Get, Post, Body, UseGuards, UseInterceptors, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ReportingEngineService } from './reporting-engine.service';
import { ExportService } from '../../common/services/export.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('reporting/engine')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class ReportingEngineController {
  constructor(
    private readonly engine: ReportingEngineService,
    private readonly exportService: ExportService,
  ) {}

  @Get('semantic-layer')
  getSemanticLayer() {
    return this.engine.getSemanticLayer();
  }

  @Post('query')
  async executeQuery(@Req() req: AuthReq, @Body() body: {
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

  @Post('export')
  async exportQuery(@Req() req: AuthReq, @Res() res: Response, @Body() body: {
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
