import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { CatchWeightRecallService } from './catch-weight-recall.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest { user: { tenantId: string; orgId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
@Controller('inventory/catch-weight-recall')
export class CatchWeightRecallController {
  constructor(private readonly svc: CatchWeightRecallService) {}

  // Dashboard
  @Permissions('inventory.catch_weight_recall.read')
  @Get('dashboard')
  dashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Catch-Weight Configs
  @Permissions('inventory.catch_weight_recall.read')
  @Get('configs')
  listConfigs(@Request() req: AuthRequest) {
    return this.svc.listConfigs(req.user.tenantId);
  }

  @Permissions('inventory.catch_weight_recall.read')
  @Get('configs/:id')
  getConfig(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getConfig(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('configs')
  upsertConfig(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertConfig(req.user.tenantId, body);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Patch('configs/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateConfig(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deactivateConfig(req.user.tenantId, id);
  }

  // Catch-Weight Readings
  @Permissions('inventory.catch_weight_recall.read')
  @Get('readings')
  listReadings(@Request() req: AuthRequest, @Query('configId') configId?: string, @Query('varianceStatus') varianceStatus?: string) {
    return this.svc.listReadings(req.user.tenantId, configId, varianceStatus);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('readings')
  captureReading(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.captureReading(req.user.tenantId, req.user.userId, body);
  }

  @Permissions('inventory.catch_weight_recall.read')
  @Get('configs/:id/variance-summary')
  getVarianceSummary(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getVarianceSummary(req.user.tenantId, id);
  }

  // Tare Library
  @Permissions('inventory.catch_weight_recall.read')
  @Get('tares')
  listTares(@Request() req: AuthRequest) {
    return this.svc.listTares(req.user.tenantId);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('tares')
  upsertTare(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertTare(req.user.tenantId, body);
  }

  // Product Recalls
  @Permissions('inventory.catch_weight_recall.read')
  @Get('recalls')
  listRecalls(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listRecalls(req.user.tenantId, status);
  }

  @Permissions('inventory.catch_weight_recall.read')
  @Get('recalls/:id')
  getRecall(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getRecall(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.read')
  @Get('recalls/:id/impact-report')
  getImpactReport(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getRecallImpactReport(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls')
  createRecall(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createRecall(req.user.tenantId, req.user.userId, body);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/issue')
  @HttpCode(HttpStatus.OK)
  issueRecall(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.issueRecall(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeRecall(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.completeRecall(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelRecall(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelRecall(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/affected-stock')
  addAffectedStock(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.addAffectedStock(req.user.tenantId, id, body);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/affected-stock/:stockId/quarantine')
  @HttpCode(HttpStatus.OK)
  quarantineStock(@Request() req: AuthRequest, @Param('id') id: string, @Param('stockId') stockId: string, @Body() body: { qty: number }) {
    return this.svc.quarantineStock(req.user.tenantId, id, stockId, body.qty);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/customer-notices')
  addCustomerNotice(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.addCustomerNotice(req.user.tenantId, id, body);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/send-notices')
  @HttpCode(HttpStatus.OK)
  sendNotices(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.sendNotices(req.user.tenantId, id);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/customer-notices/:noticeId/acknowledge')
  @HttpCode(HttpStatus.OK)
  acknowledgeNotice(@Request() req: AuthRequest, @Param('id') id: string, @Param('noticeId') noticeId: string, @Body() body: { qtyReturned?: number }) {
    return this.svc.acknowledgeCustomerNotice(req.user.tenantId, id, noticeId, body.qtyReturned);
  }

  @Permissions('inventory.catch_weight_recall.manage')
  @Post('recalls/:id/disposal-records')
  addDisposalRecord(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.addDisposalRecord(req.user.tenantId, id, req.user.userId, body);
  }
}
