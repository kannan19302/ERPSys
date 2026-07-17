import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AsnService } from './asn.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AsnDiscrepancyType } from '@prisma/client';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('inventory/asn')
export class AsnController {
  constructor(private readonly svc: AsnService) {}

  @Post()
  createAsn(@Request() req: AuthRequest, @Body() body: {
    vendorId: string; warehouseId: string; purchaseOrderId?: string;
    carrierName?: string; trackingNumber?: string; shipDate?: string;
    expectedArrival?: string; notes?: string;
  }) {
    return this.svc.createAsn(req.user.tenantId, req.user.userId, {
      ...body,
      shipDate: body.shipDate ? new Date(body.shipDate) : undefined,
      expectedArrival: body.expectedArrival ? new Date(body.expectedArrival) : undefined,
    });
  }

  @Post(':id/items')
  addLineItem(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: {
    productId: string; expectedQty: number; uom?: string;
    lotNumber?: string; serialNos?: string[]; notes?: string;
  }) {
    return this.svc.addLineItem(req.user.tenantId, id, body);
  }

  @Patch(':id/in-transit')
  markInTransit(@Request() req: AuthRequest, @Param('id') id: string, @Body('trackingNumber') trackingNumber?: string) {
    return this.svc.markInTransit(req.user.tenantId, id, trackingNumber);
  }

  @Patch(':id/arrived')
  markArrived(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.markArrived(req.user.tenantId, id);
  }

  @Patch(':id/items/:itemId/receive')
  receiveLineItem(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body('receivedQty') receivedQty: number,
  ) {
    return this.svc.receiveLineItem(req.user.tenantId, req.user.userId, id, itemId, receivedQty);
  }

  @Patch(':id/finalize')
  finalizeReceiving(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.finalizeReceiving(req.user.tenantId, id);
  }

  @Patch(':id/cancel')
  cancelAsn(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelAsn(req.user.tenantId, id);
  }

  @Post(':id/discrepancies')
  reportDiscrepancy(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: {
    discrepancyType: AsnDiscrepancyType; productId: string;
    expectedQty: number; actualQty: number; lineItemId?: string; notes?: string;
  }) {
    return this.svc.reportDiscrepancy(req.user.tenantId, req.user.userId, id, body);
  }

  @Patch('discrepancies/:discrepancyId/resolve')
  resolveDiscrepancy(
    @Request() req: AuthRequest,
    @Param('discrepancyId') discrepancyId: string,
    @Body('resolutionNote') resolutionNote: string,
  ) {
    return this.svc.resolveDiscrepancy(req.user.tenantId, req.user.userId, discrepancyId, resolutionNote);
  }

  @Get('discrepancies')
  listDiscrepancies(
    @Request() req: AuthRequest,
    @Query('asnId') asnId?: string,
    @Query('type') discrepancyType?: AsnDiscrepancyType,
  ) {
    return this.svc.listDiscrepancies(req.user.tenantId, asnId, discrepancyType);
  }

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get()
  listAsns(@Request() req: AuthRequest, @Query('status') status?: string, @Query('vendorId') vendorId?: string) {
    return this.svc.listAsns(req.user.tenantId, status, vendorId);
  }

  @Get(':id')
  getAsn(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getAsn(req.user.tenantId, id);
  }
}
