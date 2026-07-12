import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  DemandForecastingService,
  generateForecastRunSchema,
  updateForecastRunSchema,
  GenerateForecastRunInput,
  UpdateForecastRunInput,
} from './demand-forecasting.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

/**
 * Inventory Demand Forecasting API (Collab Board slug
 * `inventory-demand-forecasting`). Forecast-run CRUD + generate-forecast +
 * reorder-suggestion list/accept/dismiss.
 */
@ApiTags('inventory-demand-forecasting')
@ApiBearerAuth()
@Controller('inventory/demand-forecasting')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DemandForecastingController {
  constructor(private readonly svc: DemandForecastingService) {}

  @ApiOperation({ summary: 'List demand forecast runs' })
  @Get('runs')
  @Permissions('inventory.demand_forecast.read')
  async listRuns(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.svc.listRuns(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      sortBy,
      sortOrder,
    });
  }

  @ApiOperation({ summary: 'Get a demand forecast run' })
  @Get('runs/:id')
  @Permissions('inventory.demand_forecast.read')
  async getRun(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getRun(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get forecast lines for a run' })
  @Get('runs/:id/lines')
  @Permissions('inventory.demand_forecast.read')
  async getRunLines(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getRunLines(req.user.tenantId, id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @ApiOperation({ summary: 'Generate a new demand forecast run (moving average / exponential smoothing over historical stock-ledger outbound demand)' })
  @Post('runs/generate')
  @Permissions('inventory.demand_forecast.generate')
  @TrackChanges('DemandForecastRun')
  @UseInterceptors(ChangeHistoryInterceptor)
  async generate(@Req() req: AuthReq, @ZodBody(generateForecastRunSchema) body: GenerateForecastRunInput) {
    return this.svc.generateForecast(req.user.tenantId, req.user.orgId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Update a demand forecast run (name only)' })
  @Patch('runs/:id')
  @Permissions('inventory.demand_forecast.update')
  @TrackChanges('DemandForecastRun')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateRun(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateForecastRunSchema) body: UpdateForecastRunInput) {
    return this.svc.updateRun(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Soft-delete a demand forecast run' })
  @Delete('runs/:id')
  @Permissions('inventory.demand_forecast.delete')
  @TrackChanges('DemandForecastRun')
  @UseInterceptors(ChangeHistoryInterceptor)
  async deleteRun(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteRun(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List reorder suggestions' })
  @Get('reorder-suggestions')
  @Permissions('inventory.reorder_suggestion.read')
  async listSuggestions(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('runId') runId?: string,
  ) {
    return this.svc.listSuggestions(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      warehouseId,
      runId,
    });
  }

  @ApiOperation({ summary: 'Accept a reorder suggestion' })
  @Post('reorder-suggestions/:id/accept')
  @Permissions('inventory.reorder_suggestion.update')
  @TrackChanges('ReorderSuggestion')
  @UseInterceptors(ChangeHistoryInterceptor)
  async accept(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.acceptSuggestion(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Dismiss a reorder suggestion' })
  @Post('reorder-suggestions/:id/dismiss')
  @Permissions('inventory.reorder_suggestion.update')
  @TrackChanges('ReorderSuggestion')
  @UseInterceptors(ChangeHistoryInterceptor)
  async dismiss(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.dismissSuggestion(req.user.tenantId, id, req.user.userId);
  }
}
