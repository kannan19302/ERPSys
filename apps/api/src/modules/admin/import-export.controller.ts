import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@Controller('admin/imports')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get()
  @Permissions('admin.setting.read')
  async listImportHistory(@Req() req: AuthenticatedRequest) {
    return this.importExportService.getImportHistory(req.user.tenantId);
  }

  @Post('validate')
  @Permissions('admin.setting.read')
  async validateImport(
    @Req() req: AuthenticatedRequest,
    @Body() body: { targetModel: string; rows: Record<string, unknown>[] },
  ): Promise<unknown> {
    return this.importExportService.validateImport(
      req.user.tenantId,
      body.targetModel,
      body.rows,
    );
  }

  @Post('execute')
  @Permissions('admin.setting.read')
  async executeImport(
    @Req() req: AuthenticatedRequest,
    @Body() body: { targetModel: string; orgId: string; rows: Record<string, unknown>[] },
  ) {
    return this.importExportService.executeImport(
      req.user.tenantId,
      body.orgId,
      body.targetModel,
      body.rows,
    );
  }

  @Get('/exports/:entityType')
  @Permissions('admin.setting.read')
  async exportData(
    @Req() req: AuthenticatedRequest,
    @Param('entityType') entityType: string,
    @Query('format') format: string = 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.importExportService.exportData(
      req.user.tenantId,
      entityType,
      format,
      { startDate, endDate },
    );

    if (format === 'csv' && Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0] as object);
      const csvRows = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(',')
        ),
      ];
      return { csv: csvRows.join('\n'), filename: `${entityType}-export.csv` };
    }

    return { data, filename: `${entityType}-export.json` };
  }
}
