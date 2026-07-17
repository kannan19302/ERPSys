import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ManufacturingService } from './manufacturing.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('manufacturing')
@ApiBearerAuth()
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  // ==========================================
  // BOM ENDPOINTS
  // ==========================================

  @ApiOperation({ summary: 'Get b o ms' })
  @Get('boms')
  @Permissions('manufacturing.bom.read')
  async getBOMs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getBOMs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create b o m' })
  @Post('boms')
  @Permissions('manufacturing.bom.create')
  async createBOM(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Get workstations' })
  @Get('workstations')
  @Permissions('manufacturing.work-order.read')
  async getWorkstations(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkstations(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create workstation' })
  @Post('workstations')
  @Permissions('manufacturing.work-order.create')
  async createWorkstation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; code: string; capacityHours: number; hourlyOverheadRate: number }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'default-org-id';
    return this.manufacturingService.createWorkstation(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get workstation load balancing' })
  @Get('workstations/load-balancing')
  @Permissions('manufacturing.work-order.read')
  async getWorkstationLoadBalancing(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkstationLoadBalancing(req.user.tenantId);
  }

  // ==========================================
  // WORK ORDER ENDPOINTS
  // ==========================================

  @ApiOperation({ summary: 'Get work orders' })
  @Get('work-orders')
  @Permissions('manufacturing.work-order.read')
  async getWorkOrders(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkOrders(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create work order' })
  @Post('work-orders')
  @Permissions('manufacturing.work-order.create')
  async createWorkOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { bomId: string; workOrderNumber: string; quantity: number; startDate?: string; workstationId?: string }
  ): Promise<unknown> {
    return this.manufacturingService.createWorkOrder(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Start work order' })
  @Post('work-orders/:id/start')
  @Permissions('manufacturing.work-order.update')
  async startWorkOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.startWorkOrder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Update work order status' })
  @Patch('work-orders/:id/status')
  @Permissions('manufacturing.work-order.update')
  async updateWorkOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string }
  ): Promise<unknown> {
    return this.manufacturingService.updateWorkOrderStatus(req.user.tenantId, id, dto.status);
  }

  @ApiOperation({ summary: 'Log scrap and oee' })
  @Patch('work-orders/:id/oee')
  @Permissions('manufacturing.work-order.update')
  async logScrapAndOee(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { oeeScore: number; scrapQuantity: number; lotNumber?: string }
  ): Promise<unknown> {
    return this.manufacturingService.logScrapAndOee(req.user.tenantId, id, dto);
  }

  // ==========================================
  // MRP RUNS & PLANNED ITEMS
  // ==========================================

  @ApiOperation({ summary: 'Get m r p runs' })
  @Get('mrp/runs')
  @Permissions('manufacturing.work-order.read')
  async getMRPRuns(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getMRPRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Run m r p' })
  @Post('mrp/run')
  @Permissions('manufacturing.work-order.create')
  async runMRP(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.runMRP(req.user.tenantId, req.user.email);
  }

  @ApiOperation({ summary: 'Process m r p planned item' })
  @Post('mrp/planned-items/:id/process')
  @Permissions('manufacturing.work-order.create')
  async processMRPPlannedItem(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.processMRPPlannedItem(req.user.tenantId, id);
  }

  // ==========================================
  // QUALITY CONTROL & NCR
  // ==========================================

  @ApiOperation({ summary: 'Get quality plans' })
  @Get('quality/plans')
  @Permissions('manufacturing.bom.read')
  async getQualityPlans(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getQualityPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create quality plan' })
  @Post('quality/plans')
  @Permissions('manufacturing.bom.create')
  async createQualityPlan(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { productId: string; name: string; code: string; checks: string }
  ): Promise<unknown> {
    return this.manufacturingService.createQualityPlan(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Log inspection' })
  @Post('quality/inspections')
  @Permissions('manufacturing.work-order.update')
  async logInspection(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Get n c rs' })
  @Get('quality/ncr')
  @Permissions('manufacturing.work-order.read')
  async getNCRs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getNCRs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create n c r' })
  @Post('quality/ncr')
  @Permissions('manufacturing.work-order.create')
  async createNCR(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Resolve n c r' })
  @Patch('quality/ncr/:id')
  @Permissions('manufacturing.work-order.update')
  async resolveNCR(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { disposition: string; status: string; resolvedBy?: string }
  ): Promise<unknown> {
    return this.manufacturingService.resolveNCR(req.user.tenantId, id, dto);
  }

  // ==========================================
  // MACHINE DOWNTIME & CMMS MAINTENANCE
  // ==========================================

  @ApiOperation({ summary: 'Get maintenance requests' })
  @Get('maintenance')
  @Permissions('manufacturing.work-order.read')
  async getMaintenanceRequests(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getMaintenanceRequests(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create maintenance request' })
  @Post('maintenance')
  @Permissions('manufacturing.work-order.create')
  async createMaintenanceRequest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { workstationId: string; type: string; priority: string; title: string; description?: string }
  ): Promise<unknown> {
    return this.manufacturingService.createMaintenanceRequest(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get downtime logs' })
  @Get('downtime')
  @Permissions('manufacturing.work-order.read')
  async getDowntimeLogs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getDowntimeLogs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Log downtime' })
  @Post('downtime')
  @Permissions('manufacturing.work-order.create')
  async logDowntime(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { workstationId: string; downtimeCode: string; startTime: string; endTime?: string; notes?: string }
  ): Promise<unknown> {
    return this.manufacturingService.logDowntime(req.user.tenantId, dto);
  }

  // ==========================================
  // SUBCONTRACTING
  // ==========================================

  @ApiOperation({ summary: 'Get subcontracting orders' })
  @Get('subcontracting')
  @Permissions('manufacturing.bom.read')
  async getSubcontractingOrders(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getSubcontractingOrders(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create subcontracting order' })
  @Post('subcontracting')
  @Permissions('manufacturing.bom.create')
  async createSubcontractingOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { vendorId: string; productId: string; quantity: number; unitCost: number; deliveryDate?: string }
  ): Promise<unknown> {
    return this.manufacturingService.createSubcontractingOrder(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update subcontracting status' })
  @Patch('subcontracting/:id')
  @Permissions('manufacturing.bom.update')
  async updateSubcontractingStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string }
  ): Promise<unknown> {
    return this.manufacturingService.updateSubcontractingStatus(req.user.tenantId, id, dto.status);
  }

  // ==========================================
  // ADVANCED GAPS ENDPOINTS
  // ==========================================

  @ApiOperation({ summary: 'Get b o m tree' })
  @Get('boms/:id/tree')
  @Permissions('manufacturing.bom.read')
  async getBOMTree(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.getBOMTree(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get work order operations' })
  @Get('work-orders/:id/operations')
  @Permissions('manufacturing.work-order.read')
  async getWorkOrderOperations(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.getWorkOrderOperations(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Start operation step' })
  @Post('work-orders/:id/operations/:opId/start')
  @Permissions('manufacturing.work-order.update')
  async startOperationStep(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('opId') opId: string
  ): Promise<unknown> {
    return this.manufacturingService.startOperationStep(req.user.tenantId, id, opId, req.user.email);
  }

  @ApiOperation({ summary: 'Complete operation step' })
  @Post('work-orders/:id/operations/:opId/complete')
  @Permissions('manufacturing.work-order.update')
  async completeOperationStep(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('opId') opId: string,
    @ZodBody(z.any()) dto: { scrapQuantity?: number; lotNumberConsumed?: string; componentProductId?: string }
  ): Promise<unknown> {
    return this.manufacturingService.completeOperationStep(req.user.tenantId, id, opId, dto);
  }

  @ApiOperation({ summary: 'Get equipment tools' })
  @Get('tools')
  @Permissions('manufacturing.work-order.read')
  async getEquipmentTools(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getEquipmentTools(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get workstation shifts' })
  @Get('shifts')
  @Permissions('manufacturing.work-order.read')
  async getWorkstationShifts(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getWorkstationShifts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create workstation shift' })
  @Post('shifts')
  @Permissions('manufacturing.work-order.create')
  async createWorkstationShift(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { workstationId: string; name: string; startTime: string; endTime: string; daysOfWeek: number[] }
  ): Promise<unknown> {
    return this.manufacturingService.createWorkstationShift(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get subcontracting materials' })
  @Get('subcontracting/:id/materials')
  @Permissions('manufacturing.bom.read')
  async getSubcontractingMaterials(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.manufacturingService.getSubcontractingMaterials(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Issue subcontracting materials' })
  @Post('subcontracting/:id/issue')
  @Permissions('manufacturing.bom.update')
  async issueSubcontractingMaterials(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { materials: Array<{ productId: string; quantity: number; warehouseId: string }> }
  ): Promise<unknown> {
    return this.manufacturingService.issueSubcontractingMaterials(req.user.tenantId, id, dto.materials);
  }

  @ApiOperation({ summary: 'Reconcile subcontracting materials' })
  @Post('subcontracting/:id/reconcile')
  @Permissions('manufacturing.bom.update')
  async reconcileSubcontractingMaterials(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { materials: Array<{ productId: string; quantity: number }> }
  ): Promise<unknown> {
    return this.manufacturingService.reconcileSubcontractingMaterials(req.user.tenantId, id, dto.materials);
  }

  @ApiOperation({ summary: 'Get e c os' })
  @Get('ecos')
  @Permissions('manufacturing.bom.read')
  async getECOs(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getECOs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Submit e c o' })
  @Post('ecos')
  @Permissions('manufacturing.bom.create')
  async submitECO(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { bomId: string; changeDescription: string; requestedBy: string }
  ): Promise<unknown> {
    return this.manufacturingService.submitECO(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Resolve e c o' })
  @Post('ecos/:id/resolve')
  @Permissions('manufacturing.bom.update')
  async resolveECO(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string }
  ): Promise<unknown> {
    return this.manufacturingService.resolveECO(req.user.tenantId, id, dto.status, req.user.email);
  }

  @ApiOperation({ summary: 'Get detailed o e e analytics' })
  @Get('diagnostics/oee')
  @Permissions('manufacturing.work-order.read')
  async getDetailedOEEAnalytics(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.manufacturingService.getDetailedOEEAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get lot genealogy' })
  @Get('diagnostics/genealogy/:lotNumber')
  @Permissions('manufacturing.work-order.read')
  async getLotGenealogy(@Req() req: AuthenticatedRequest, @Param('lotNumber') lotNumber: string): Promise<unknown> {
    return this.manufacturingService.getLotGenealogy(req.user.tenantId, lotNumber);
  }
}
