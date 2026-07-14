import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CostingMethodsService } from './costing-methods.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('inventory/costing')
export class CostingMethodsController {
  constructor(private readonly svc: CostingMethodsService) {}

  @Permissions('inventory.costing_methods.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Permissions('inventory.costing_methods.manage')
  @Post('profiles')
  upsertProfile(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.upsertProfile(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.costing_methods.read')
  @Get('profiles')
  listProfiles(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listProfiles(req.user.tenantId, {
      productId: q.productId, method: q.method,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.costing_methods.read')
  @Get('profiles/:id')
  getProfile(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getProfile(req.user.tenantId, id);
  }

  @Permissions('inventory.costing_methods.manage')
  @Post('profiles/:id/layers')
  addCostLayer(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.svc.addCostLayer(req.user.tenantId, { ...dto, profileId: id });
  }

  @Permissions('inventory.costing_methods.read')
  @Get('profiles/:id/layers')
  listCostLayers(@Request() req: AuthRequest, @Param('id') id: string, @Query('onlyOpen') onlyOpen?: string) {
    return this.svc.listCostLayers(req.user.tenantId, id, onlyOpen === 'true');
  }

  @Permissions('inventory.costing_methods.manage')
  @Post('profiles/:id/consume')
  consumeLayer(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { qty: number; method?: string }) {
    return this.svc.consumeLayer(req.user.tenantId, id, dto.qty, dto.method);
  }

  @Permissions('inventory.costing_methods.manage')
  @Post('adjustments')
  createAdjustment(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createAdjustment(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.costing_methods.read')
  @Get('adjustments')
  listAdjustments(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listAdjustments(req.user.tenantId, {
      profileId: q.profileId, adjustmentType: q.adjustmentType,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.costing_methods.read')
  @Get('valuation')
  getValuation(@Request() req: AuthRequest, @Query('productId') productId?: string) {
    return this.svc.getValuation(req.user.tenantId, productId);
  }
}
