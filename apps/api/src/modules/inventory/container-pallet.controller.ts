import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ContainerPalletService } from './container-pallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest { user: { tenantId: string; orgId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('inventory/container-pallet')
export class ContainerPalletController {
  constructor(private readonly svc: ContainerPalletService) {}

  // Dashboard
  @Get('dashboard')
  dashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Pallet Types
  @Get('pallet-types')
  listPalletTypes(@Request() req: AuthRequest) {
    return this.svc.listPalletTypes(req.user.tenantId);
  }

  @Post('pallet-types')
  createPalletType(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createPalletType(req.user.tenantId, body);
  }

  @Patch('pallet-types/:id')
  updatePalletType(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePalletType(req.user.tenantId, id, body);
  }

  @Delete('pallet-types/:id')
  @HttpCode(HttpStatus.OK)
  deletePalletType(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deletePalletType(req.user.tenantId, id);
  }

  // Container Types
  @Get('container-types')
  listContainerTypes(@Request() req: AuthRequest) {
    return this.svc.listContainerTypes(req.user.tenantId);
  }

  @Post('container-types')
  createContainerType(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createContainerType(req.user.tenantId, body);
  }

  @Patch('container-types/:id')
  updateContainerType(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateContainerType(req.user.tenantId, id, body);
  }

  @Delete('container-types/:id')
  @HttpCode(HttpStatus.OK)
  deleteContainerType(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deleteContainerType(req.user.tenantId, id);
  }

  // Load Plans
  @Get('load-plans')
  listLoadPlans(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listLoadPlans(req.user.tenantId, status);
  }

  @Get('load-plans/:id')
  getLoadPlan(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getLoadPlan(req.user.tenantId, id);
  }

  @Get('load-plans/:id/utilization')
  getLoadPlanUtilization(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getLoadPlanUtilization(req.user.tenantId, id);
  }

  @Post('load-plans')
  createLoadPlan(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createLoadPlan(req.user.tenantId, req.user.userId, body);
  }

  @Post('load-plans/:id/transition')
  transitionLoadPlan(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: { action: string }) {
    return this.svc.transitionLoadPlan(req.user.tenantId, id, body.action, req.user.userId);
  }

  @Post('load-plans/:id/pallets')
  addPallet(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.addPalletToLoadPlan(req.user.tenantId, id, body);
  }

  @Delete('load-plans/:id/pallets/:palletId')
  @HttpCode(HttpStatus.OK)
  removePallet(@Request() req: AuthRequest, @Param('id') id: string, @Param('palletId') palletId: string) {
    return this.svc.removePalletFromLoadPlan(req.user.tenantId, id, palletId);
  }

  @Post('load-plans/:id/items')
  addLoadItem(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.addItemToLoadPlan(req.user.tenantId, id, body);
  }

  // Packing Plans
  @Get('packing-plans')
  listPackingPlans(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listPackingPlans(req.user.tenantId, status);
  }

  @Get('packing-plans/:id')
  getPackingPlan(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getPackingPlan(req.user.tenantId, id);
  }

  @Post('packing-plans')
  createPackingPlan(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createPackingPlan(req.user.tenantId, req.user.userId, body);
  }

  @Post('packing-plans/:id/transition')
  transitionPackingPlan(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: { action: string }) {
    return this.svc.transitionPackingPlan(req.user.tenantId, id, body.action);
  }

  @Post('packing-plans/:id/cartons')
  addCarton(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.addCartonToPackingPlan(req.user.tenantId, id, body);
  }

  @Post('packing-plans/:id/cartons/:cartonId/seal')
  sealCarton(@Request() req: AuthRequest, @Param('id') id: string, @Param('cartonId') cartonId: string) {
    return this.svc.sealCarton(req.user.tenantId, id, cartonId);
  }

  @Post('packing-plans/:id/cartons/:cartonId/label')
  printLabel(@Request() req: AuthRequest, @Param('id') id: string, @Param('cartonId') cartonId: string) {
    return this.svc.printCartonLabel(req.user.tenantId, id, cartonId);
  }

  @Post('packing-plans/:id/cartons/:cartonId/items')
  addCartonItem(@Request() req: AuthRequest, @Param('id') id: string, @Param('cartonId') cartonId: string, @Body() body: any) {
    return this.svc.addItemToCarton(req.user.tenantId, id, cartonId, body);
  }
}
