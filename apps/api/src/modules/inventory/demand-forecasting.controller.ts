import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  DemandForecastingService,
  createForecastSchema,
  updateActualSchema,
  calculateReorderPointSchema,
  upsertSafetyStockConfigSchema,
  createReplenishmentOrderSchema,
  approveReplenishmentSchema,
  generateStockoutPredictionsSchema,
  acknowledgeStockoutSchema,
  runForecastEngineSchema,
} from './demand-forecasting.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/demand-forecasting')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class DemandForecastingController {
  constructor(private readonly svc: DemandForecastingService) {}

  // Dashboard
  @Get('dashboard')
  getDashboard(@Req() req: AuthReq) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get('replenishment-summary')
  getReplenishmentSummary(@Req() req: AuthReq) {
    return this.svc.getReplenishmentSummary(req.user.tenantId);
  }

  @Get('forecast-accuracy')
  getForecastAccuracy(@Req() req: AuthReq, @Query('productId') productId?: string) {
    return this.svc.getForecastAccuracy(req.user.tenantId, productId);
  }

  @Get('reorder-alerts')
  checkReorderAlerts(@Req() req: AuthReq) {
    return this.svc.checkReorderAlerts(req.user.tenantId);
  }

  // Forecasts
  @Get('forecasts')
  listForecasts(@Req() req: AuthReq, @Query('productId') productId?: string, @Query('status') status?: string) {
    return this.svc.listForecasts(req.user.tenantId, productId, status);
  }

  @Post('forecasts')
  createForecast(@Req() req: AuthReq, @ZodBody(createForecastSchema) body: any) {
    return this.svc.createForecast(req.user.tenantId, req.user.userId, body);
  }

  @Post('forecasts/run-engine')
  runForecastEngine(@Req() req: AuthReq, @ZodBody(runForecastEngineSchema) body: any) {
    return this.svc.runForecastEngine(req.user.tenantId, req.user.userId, body);
  }

  @Get('forecasts/:id')
  getForecast(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getForecast(req.user.tenantId, id);
  }

  @Patch('forecasts/:id/actual')
  updateActual(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateActualSchema) body: any) {
    return this.svc.updateActual(req.user.tenantId, id, body);
  }

  @Patch('forecasts/:id/archive')
  archiveForecast(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.archiveForecast(req.user.tenantId, id);
  }

  // Reorder Points
  @Get('reorder-points')
  listReorderPoints(
    @Req() req: AuthReq,
    @Query('productId') productId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.svc.listReorderPoints(req.user.tenantId, productId, activeOnly === 'true');
  }

  @Post('reorder-points/calculate')
  calculateReorderPoint(@Req() req: AuthReq, @ZodBody(calculateReorderPointSchema) body: any) {
    return this.svc.calculateReorderPoint(req.user.tenantId, body);
  }

  @Get('reorder-points/:id')
  getReorderPoint(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getReorderPoint(req.user.tenantId, id);
  }

  @Patch('reorder-points/:id/deactivate')
  deactivateReorderPoint(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deactivateReorderPoint(req.user.tenantId, id);
  }

  // Safety Stock
  @Get('safety-stock')
  listSafetyStockConfigs(@Req() req: AuthReq, @Query('productId') productId?: string) {
    return this.svc.listSafetyStockConfigs(req.user.tenantId, productId);
  }

  @Post('safety-stock')
  upsertSafetyStockConfig(@Req() req: AuthReq, @ZodBody(upsertSafetyStockConfigSchema) body: any) {
    return this.svc.upsertSafetyStockConfig(req.user.tenantId, body);
  }

  @Delete('safety-stock/:id')
  deleteSafetyStockConfig(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteSafetyStockConfig(req.user.tenantId, id);
  }

  // Replenishment Orders
  @Get('replenishment-orders')
  listReplenishmentOrders(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.svc.listReplenishmentOrders(req.user.tenantId, status, priority);
  }

  @Post('replenishment-orders')
  createReplenishmentOrder(@Req() req: AuthReq, @ZodBody(createReplenishmentOrderSchema) body: any) {
    return this.svc.createReplenishmentOrder(req.user.tenantId, req.user.userId, body);
  }

  @Post('replenishment-orders/auto-generate')
  autoGenerateReplenishments(@Req() req: AuthReq) {
    return this.svc.autoGenerateReplenishments(req.user.tenantId, req.user.userId);
  }

  @Get('replenishment-orders/:id')
  getReplenishmentOrder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getReplenishmentOrder(req.user.tenantId, id);
  }

  @Post('replenishment-orders/:id/approve')
  approveReplenishmentOrder(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @ZodBody(approveReplenishmentSchema) body: any,
  ) {
    return this.svc.approveReplenishmentOrder(req.user.tenantId, id, req.user.userId, body);
  }

  @Patch('replenishment-orders/:id/status')
  updateReplenishmentStatus(@Req() req: AuthReq, @Param('id') id: string, @Query('status') status: string) {
    return this.svc.updateReplenishmentStatus(req.user.tenantId, id, status);
  }

  @Patch('replenishment-orders/:id/cancel')
  cancelReplenishmentOrder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.cancelReplenishmentOrder(req.user.tenantId, id);
  }

  // Stockout Predictions
  @Get('stockout-predictions')
  listStockoutPredictions(
    @Req() req: AuthReq,
    @Query('riskLevel') riskLevel?: string,
    @Query('acknowledged') acknowledged?: string,
  ) {
    const ack = acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined;
    return this.svc.listStockoutPredictions(req.user.tenantId, riskLevel, ack);
  }

  @Post('stockout-predictions/generate')
  generateStockoutPredictions(@Req() req: AuthReq, @ZodBody(generateStockoutPredictionsSchema) body: any) {
    return this.svc.generateStockoutPredictions(req.user.tenantId, body);
  }

  @Get('stockout-predictions/:id')
  getStockoutPrediction(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getStockoutPrediction(req.user.tenantId, id);
  }

  @Patch('stockout-predictions/:id/acknowledge')
  acknowledgeStockoutPrediction(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @ZodBody(acknowledgeStockoutSchema) body: any,
  ) {
    return this.svc.acknowledgeStockoutPrediction(req.user.tenantId, id, body);
  }
}
