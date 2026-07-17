import { Controller, Get, Post, Patch, Param, UseGuards, Req, Put, Delete, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SupplyChainService } from './supply-chain.service';
import { CreateShipmentInput, UpdateShipmentStatusInput } from '@unerp/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  createCarrierSchema,
  createCarrierServiceLevelSchema,
  createAsnSchema,
  receiveAsnSchema,
  createInboundShipmentSchema,
  createOutboundShipmentSchema,
  addTrackingEventSchema,
  reportExceptionSchema,
  resolveExceptionSchema,
  CreateCarrierDto,
  CreateCarrierServiceLevelDto,
  CreateAsnDto,
  ReceiveAsnDto,
  CreateInboundShipmentDto,
  CreateOutboundShipmentDto,
  AddTrackingEventDto,
  ReportExceptionDto,
  ResolveExceptionDto,
} from './dto/supply-chain.dto';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainController {
  constructor(private readonly supplyChainService: SupplyChainService) { }

  // Legacy endpoints kept for backward compatibility

  @ApiOperation({ summary: 'Get shipments' })
  @Get('shipments')
  @Permissions('supply-chain.shipment.read')
  async getShipments(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getShipments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get shipment by id' })
  @Get('shipments/:id')
  @Permissions('supply-chain.shipment.read')
  async getShipmentById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.supplyChainService.getShipmentById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create shipment' })
  @Post('shipments')
  @Permissions('supply-chain.shipment.create')
  async createShipment(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateShipmentInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.supplyChainService.createShipment(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Update shipment status' })
  @Patch('shipments/:id/status')
  @Permissions('supply-chain.shipment.update')
  async updateShipmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: UpdateShipmentStatusInput,
  ): Promise<unknown> {
    return this.supplyChainService.updateShipmentStatus(req.user.tenantId, id, dto.status);
  }

  @ApiOperation({ summary: 'Get demand forecast' })
  @Get('forecast')
  @Permissions('supply-chain.forecast.read')
  async getDemandForecast(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getDemandForecast(req.user.tenantId);
  }

  // ==========================================
  // CARRIERS
  // ==========================================

  @ApiOperation({ summary: 'Get carriers' })
  @Get('carriers')
  @Permissions('supply-chain.carrier.read')
  async getCarriers(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getCarriers(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get carrier by id' })
  @Get('carriers/:id')
  @Permissions('supply-chain.carrier.read')
  async getCarrierById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.supplyChainService.getCarrierById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create carrier' })
  @Post('carriers')
  @Permissions('supply-chain.carrier.create')
  async createCarrier(@Req() req: AuthenticatedRequest, @ZodBody(createCarrierSchema) dto: CreateCarrierDto) {
    return this.supplyChainService.createCarrier(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update carrier' })
  @Put('carriers/:id')
  @Permissions('supply-chain.carrier.update')
  async updateCarrier(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(createCarrierSchema.partial()) dto: Partial<CreateCarrierDto>,
  ) {
    return this.supplyChainService.updateCarrier(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete carrier' })
  @Delete('carriers/:id')
  @Permissions('supply-chain.carrier.delete')
  async deleteCarrier(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.supplyChainService.deleteCarrier(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get carrier service levels' })
  @Get('carriers/:id/service-levels')
  @Permissions('supply-chain.carrier.read')
  async getCarrierServiceLevels(@Req() req: AuthenticatedRequest, @Param('id') carrierId: string) {
    return this.supplyChainService.getCarrierServiceLevels(req.user.tenantId, carrierId);
  }

  @ApiOperation({ summary: 'Create carrier service level' })
  @Post('carriers/:id/service-levels')
  @Permissions('supply-chain.carrier.create')
  async createCarrierServiceLevel(
    @Req() req: AuthenticatedRequest,
    @Param('id') carrierId: string,
    @ZodBody(createCarrierServiceLevelSchema) dto: CreateCarrierServiceLevelDto,
  ) {
    return this.supplyChainService.createCarrierServiceLevel(req.user.tenantId, carrierId, dto);
  }

  // ==========================================
  // ADVANCE SHIPPING NOTICES (ASN)
  // ==========================================

  @ApiOperation({ summary: 'Get ASNs' })
  @Get('asn')
  @Permissions('supply-chain.asn.read')
  async getAsns(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getAsns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get ASN by id' })
  @Get('asn/:id')
  @Permissions('supply-chain.asn.read')
  async getAsnById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.supplyChainService.getAsnById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create ASN' })
  @Post('asn')
  @Permissions('supply-chain.asn.create')
  async createAsn(@Req() req: AuthenticatedRequest, @ZodBody(createAsnSchema) dto: CreateAsnDto) {
    return this.supplyChainService.createAsn(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Receive ASN' })
  @Post('asn/:id/receive')
  @Permissions('supply-chain.asn.update')
  async receiveAsn(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(receiveAsnSchema) dto: ReceiveAsnDto,
  ) {
    return this.supplyChainService.receiveAsn(req.user.tenantId, id, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get ASN discrepancies' })
  @Get('asn/:id/discrepancies')
  @Permissions('supply-chain.asn.read')
  async getAsnDiscrepancies(@Req() req: AuthenticatedRequest, @Param('id') asnId: string) {
    return this.supplyChainService.getAsnDiscrepancies(req.user.tenantId, asnId);
  }

  // ==========================================
  // INBOUND SHIPMENTS
  // ==========================================

  @ApiOperation({ summary: 'Get inbound shipments' })
  @Get('inbound-shipments')
  @Permissions('supply-chain.shipment.read')
  async getInboundShipments(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getInboundShipments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get inbound shipment by id' })
  @Get('inbound-shipments/:id')
  @Permissions('supply-chain.shipment.read')
  async getInboundShipmentById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.supplyChainService.getInboundShipmentById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create inbound shipment' })
  @Post('inbound-shipments')
  @Permissions('supply-chain.shipment.create')
  async createInboundShipment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createInboundShipmentSchema) dto: CreateInboundShipmentDto,
  ) {
    return this.supplyChainService.createInboundShipment(req.user.tenantId, dto);
  }

  // ==========================================
  // OUTBOUND SHIPMENTS
  // ==========================================

  @ApiOperation({ summary: 'Get outbound shipments' })
  @Get('outbound-shipments')
  @Permissions('supply-chain.shipment.read')
  async getOutboundShipments(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getOutboundShipments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get outbound shipment by id' })
  @Get('outbound-shipments/:id')
  @Permissions('supply-chain.shipment.read')
  async getOutboundShipmentById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.supplyChainService.getOutboundShipmentById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create outbound shipment' })
  @Post('outbound-shipments')
  @Permissions('supply-chain.shipment.create')
  async createOutboundShipment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createOutboundShipmentSchema) dto: CreateOutboundShipmentDto,
  ) {
    return this.supplyChainService.createOutboundShipment(req.user.tenantId, dto);
  }

  // ==========================================
  // TRACKING EVENTS & EXCEPTIONS
  // ==========================================

  @ApiOperation({ summary: 'Add tracking event' })
  @Post('shipments/:type/:id/events')
  @Permissions('supply-chain.shipment.update')
  async addTrackingEvent(
    @Req() req: AuthenticatedRequest,
    @Param('type') shipmentType: 'inbound' | 'outbound',
    @Param('id') shipmentId: string,
    @ZodBody(addTrackingEventSchema) dto: AddTrackingEventDto,
  ) {
    if (shipmentType !== 'inbound' && shipmentType !== 'outbound') {
      throw new BadRequestException('Invalid shipment type. Must be inbound or outbound.');
    }
    return this.supplyChainService.addTrackingEvent(req.user.tenantId, shipmentType, shipmentId, dto);
  }

  @ApiOperation({ summary: 'Get tracking events' })
  @Get('shipments/:type/:id/events')
  @Permissions('supply-chain.shipment.read')
  async getTrackingEvents(
    @Req() req: AuthenticatedRequest,
    @Param('type') shipmentType: 'inbound' | 'outbound',
    @Param('id') shipmentId: string,
  ) {
    if (shipmentType !== 'inbound' && shipmentType !== 'outbound') {
      throw new BadRequestException('Invalid shipment type. Must be inbound or outbound.');
    }
    return this.supplyChainService.getTrackingEvents(req.user.tenantId, shipmentType, shipmentId);
  }

  @ApiOperation({ summary: 'Report exception' })
  @Post('shipments/:id/exceptions')
  @Permissions('supply-chain.exception.update')
  async reportException(
    @Req() req: AuthenticatedRequest,
    @Param('id') shipmentId: string,
    @ZodBody(reportExceptionSchema) dto: ReportExceptionDto,
  ) {
    return this.supplyChainService.reportException(req.user.tenantId, shipmentId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Resolve exception' })
  @Patch('exceptions/:id/resolve')
  @Permissions('supply-chain.exception.update')
  async resolveException(
    @Req() req: AuthenticatedRequest,
    @Param('id') exceptionId: string,
    @ZodBody(resolveExceptionSchema) dto: ResolveExceptionDto,
  ) {
    return this.supplyChainService.resolveException(req.user.tenantId, exceptionId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get exceptions for shipment' })
  @Get('shipments/:id/exceptions')
  @Permissions('supply-chain.exception.read')
  async getExceptions(@Req() req: AuthenticatedRequest, @Param('id') shipmentId: string) {
    return this.supplyChainService.getExceptions(req.user.tenantId, shipmentId);
  }
}
