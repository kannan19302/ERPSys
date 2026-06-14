import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ManufacturingService } from './manufacturing.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  // ==========================================
  // BOM ENDPOINTS
  // ==========================================

  @Get('boms')
  @Permissions('manufacturing.bom.read')
  async getBOMs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getBOMs(req.user.tenantId);
  }

  @Post('boms')
  @Permissions('manufacturing.bom.create')
  async createBOM(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      productId: string;
      name: string;
      code: string;
      materialCost?: number;
      overheadCost?: number;
      standardCost?: number;
      routingJson?: string;
      items: Array<{ productId: string; quantity: number; type?: string }>;
    }
  ): Promise<unknown> {
    return this.manufacturingService.createBOM(req.user.tenantId, dto);
  }

  // ==========================================
  // WORKSTATIONS & LOAD BALANCING
  // ==========================================

  @Get('workstations')
  @Permissions('manufacturing.work-order.read')
  async getWorkstations(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkstations(req.user.tenantId);
  }

  @Post('workstations')
  @Permissions('manufacturing.work-order.create')
  async createWorkstation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; code: string; capacityHours: number; hourlyOverheadRate: number }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'default-org-id';
    return this.manufacturingService.createWorkstation(req.user.tenantId, orgId, dto);
  }

  @Get('workstations/load-balancing')
  @Permissions('manufacturing.work-order.read')
  async getWorkstationLoadBalancing(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkstationLoadBalancing(req.user.tenantId);
  }

  // ==========================================
  // WORK ORDER ENDPOINTS
  // ==========================================

  @Get('work-orders')
  @Permissions('manufacturing.work-order.read')
  async getWorkOrders(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkOrders(req.user.tenantId);
  }

  @Post('work-orders')
  @Permissions('manufacturing.work-order.create')
  async createWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { bomId: string; workOrderNumber: string; quantity: number; startDate?: string; workstationId?: string }
  ): Promise<unknown> {
    return this.manufacturingService.createWorkOrder(req.user.tenantId, dto);
  }

  @Post('work-orders/:id/start')
  @Permissions('manufacturing.work-order.update')
  async startWorkOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.startWorkOrder(req.user.tenantId, id);
  }

  @Patch('work-orders/:id/status')
  @Permissions('manufacturing.work-order.update')
  async updateWorkOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: string }
  ): Promise<unknown> {
    return this.manufacturingService.updateWorkOrderStatus(req.user.tenantId, id, dto.status);
  }

  @Patch('work-orders/:id/oee')
  @Permissions('manufacturing.work-order.update')
  async logScrapAndOee(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { oeeScore: number; scrapQuantity: number; lotNumber?: string }
  ): Promise<unknown> {
    return this.manufacturingService.logScrapAndOee(req.user.tenantId, id, dto);
  }

  // ==========================================
  // MRP RUNS & PLANNED ITEMS
  // ==========================================

  @Get('mrp/runs')
  @Permissions('manufacturing.work-order.read')
  async getMRPRuns(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getMRPRuns(req.user.tenantId);
  }

  @Post('mrp/run')
  @Permissions('manufacturing.work-order.create')
  async runMRP(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.runMRP(req.user.tenantId, req.user.email);
  }

  @Post('mrp/planned-items/:id/process')
  @Permissions('manufacturing.work-order.create')
  async processMRPPlannedItem(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.processMRPPlannedItem(req.user.tenantId, id);
  }

  // ==========================================
  // QUALITY CONTROL & NCR
  // ==========================================

  @Get('quality/plans')
  @Permissions('manufacturing.bom.read')
  async getQualityPlans(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getQualityPlans(req.user.tenantId);
  }

  @Post('quality/plans')
  @Permissions('manufacturing.bom.create')
  async createQualityPlan(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { productId: string; name: string; code: string; checks: string }
  ): Promise<unknown> {
    return this.manufacturingService.createQualityPlan(req.user.tenantId, dto);
  }

  @Post('quality/inspections')
  @Permissions('manufacturing.work-order.update')
  async logInspection(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      inspectionNumber: string;
      referenceType: string;
      referenceId: string;
      productId: string;
      status: string;
      inspectedQty: number;
      passedQty: number;
      inspectedBy: string;
      checklistJson: string;
    }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'default-org-id';
    return this.manufacturingService.logInspection(req.user.tenantId, orgId, dto);
  }

  @Get('quality/ncr')
  @Permissions('manufacturing.work-order.read')
  async getNCRs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getNCRs(req.user.tenantId);
  }

  @Post('quality/ncr')
  @Permissions('manufacturing.work-order.create')
  async createNCR(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      workOrderId?: string;
      productId: string;
      title: string;
      description?: string;
      disposition: string;
      loggedBy?: string;
    }
  ): Promise<unknown> {
    return this.manufacturingService.createNCR(req.user.tenantId, dto);
  }

  @Patch('quality/ncr/:id')
  @Permissions('manufacturing.work-order.update')
  async resolveNCR(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { disposition: string; status: string; resolvedBy?: string }
  ): Promise<unknown> {
    return this.manufacturingService.resolveNCR(req.user.tenantId, id, dto);
  }

  // ==========================================
  // MACHINE DOWNTIME & CMMS MAINTENANCE
  // ==========================================

  @Get('maintenance')
  @Permissions('manufacturing.work-order.read')
  async getMaintenanceRequests(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getMaintenanceRequests(req.user.tenantId);
  }

  @Post('maintenance')
  @Permissions('manufacturing.work-order.create')
  async createMaintenanceRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { workstationId: string; type: string; priority: string; title: string; description?: string }
  ): Promise<unknown> {
    return this.manufacturingService.createMaintenanceRequest(req.user.tenantId, dto);
  }

  @Get('downtime')
  @Permissions('manufacturing.work-order.read')
  async getDowntimeLogs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getDowntimeLogs(req.user.tenantId);
  }

  @Post('downtime')
  @Permissions('manufacturing.work-order.create')
  async logDowntime(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { workstationId: string; downtimeCode: string; startTime: string; endTime?: string; notes?: string }
  ): Promise<unknown> {
    return this.manufacturingService.logDowntime(req.user.tenantId, dto);
  }

  // ==========================================
  // SUBCONTRACTING
  // ==========================================

  @Get('subcontracting')
  @Permissions('manufacturing.bom.read')
  async getSubcontractingOrders(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getSubcontractingOrders(req.user.tenantId);
  }

  @Post('subcontracting')
  @Permissions('manufacturing.bom.create')
  async createSubcontractingOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { vendorId: string; productId: string; quantity: number; unitCost: number; deliveryDate?: string }
  ): Promise<unknown> {
    return this.manufacturingService.createSubcontractingOrder(req.user.tenantId, dto);
  }

  @Patch('subcontracting/:id')
  @Permissions('manufacturing.bom.update')
  async updateSubcontractingStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: string }
  ): Promise<unknown> {
    return this.manufacturingService.updateSubcontractingStatus(req.user.tenantId, id, dto.status);
  }
}
