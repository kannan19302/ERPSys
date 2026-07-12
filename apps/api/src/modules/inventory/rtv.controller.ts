import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  RtvService,
  createReasonCodeSchema, CreateReasonCodeInput,
  updateReasonCodeSchema, UpdateReasonCodeInput,
  createRmaRequestSchema, CreateRmaRequestInput,
  updateRmaStatusSchema, UpdateRmaStatusInput,
  rejectRmaSchema, RejectRmaInput,
  createShipmentSchema, CreateShipmentInput,
  recordCreditMemoSchema, RecordCreditMemoInput,
} from './rtv.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-rtv')
@ApiBearerAuth()
@Controller('inventory/rtv')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class RtvController {
  constructor(private readonly svc: RtvService) {}

  // ─── Return Reason Codes ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'List return reason codes' })
  @Get('reason-codes')
  @Permissions('inventory.rtv.read')
  async listReasonCodes(@Req() req: AuthReq, @Query('includeInactive') includeInactive?: string) {
    return this.svc.listReasonCodes(req.user.tenantId, includeInactive === 'true');
  }

  @ApiOperation({ summary: 'Create a return reason code' })
  @Post('reason-codes')
  @Permissions('inventory.rtv.manage')
  async createReasonCode(@Req() req: AuthReq, @ZodBody(createReasonCodeSchema) body: CreateReasonCodeInput) {
    return this.svc.createReasonCode(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update a return reason code' })
  @Patch('reason-codes/:id')
  @Permissions('inventory.rtv.manage')
  async updateReasonCode(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateReasonCodeSchema) body: UpdateReasonCodeInput) {
    return this.svc.updateReasonCode(req.user.tenantId, id, body);
  }

  // ─── RMA Requests ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List RMA requests' })
  @Get('rma-requests')
  @Permissions('inventory.rtv.read')
  async listRmaRequests(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.svc.listRmaRequests(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      vendorId,
    });
  }

  @ApiOperation({ summary: 'Get a single RMA request with shipments' })
  @Get('rma-requests/:id')
  @Permissions('inventory.rtv.read')
  async getRmaRequest(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getRmaRequest(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new RMA request' })
  @Post('rma-requests')
  @Permissions('inventory.rtv.create')
  async createRmaRequest(@Req() req: AuthReq, @ZodBody(createRmaRequestSchema) body: CreateRmaRequestInput) {
    return this.svc.createRmaRequest(req.user.tenantId, req.user.orgId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Submit an RMA request to the vendor' })
  @Post('rma-requests/:id/submit')
  @Permissions('inventory.rtv.update')
  async submitRmaRequest(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.submitRmaRequest(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Record vendor authorization of an RMA' })
  @Post('rma-requests/:id/authorize')
  @Permissions('inventory.rtv.update')
  async authorizeRmaRequest(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateRmaStatusSchema) body: UpdateRmaStatusInput) {
    return this.svc.authorizeRmaRequest(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Record vendor rejection of an RMA' })
  @Post('rma-requests/:id/reject')
  @Permissions('inventory.rtv.update')
  async rejectRmaRequest(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(rejectRmaSchema) body: RejectRmaInput) {
    return this.svc.rejectRmaRequest(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Mark an RMA as completed' })
  @Post('rma-requests/:id/complete')
  @Permissions('inventory.rtv.update')
  async completeRmaRequest(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeRmaRequest(req.user.tenantId, id);
  }

  // ─── Return Shipments ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List return shipments' })
  @Get('shipments')
  @Permissions('inventory.rtv.read')
  async listShipments(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('rmaRequestId') rmaRequestId?: string,
  ) {
    return this.svc.listShipments(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      rmaRequestId,
    });
  }

  @ApiOperation({ summary: 'Get a single return shipment' })
  @Get('shipments/:id')
  @Permissions('inventory.rtv.read')
  async getShipment(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getShipment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a return shipment (RMA must be AUTHORIZED)' })
  @Post('shipments')
  @Permissions('inventory.rtv.create')
  async createShipment(@Req() req: AuthReq, @ZodBody(createShipmentSchema) body: CreateShipmentInput) {
    return this.svc.createShipment(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Mark a shipment as packed' })
  @Post('shipments/:id/pack')
  @Permissions('inventory.rtv.update')
  async packShipment(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.packShipment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Mark a shipment as shipped' })
  @Post('shipments/:id/ship')
  @Permissions('inventory.rtv.update')
  async markShipped(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.markShipped(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Mark a shipment as delivered to vendor' })
  @Post('shipments/:id/deliver')
  @Permissions('inventory.rtv.update')
  async markDelivered(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.markDelivered(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Record vendor credit memo against a delivered shipment' })
  @Post('shipments/:id/credit-memo')
  @Permissions('inventory.rtv.update')
  async recordCreditMemo(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(recordCreditMemoSchema) body: RecordCreditMemoInput) {
    return this.svc.recordCreditMemo(req.user.tenantId, id, body);
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'RTV dashboard summary' })
  @Get('dashboard')
  @Permissions('inventory.rtv.read')
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getRtvDashboard(req.user.tenantId);
  }
}
