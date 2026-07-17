import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { FreightClaimsService } from './freight-claims.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('inventory/freight-claims')
export class FreightClaimsController {
  constructor(private readonly svc: FreightClaimsService) {}

  @Permissions('inventory.freight_claims.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Damage Reports
  @Permissions('inventory.freight_claims.manage')
  @Post('damage-reports')
  createDamageReport(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createDamageReport(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.freight_claims.read')
  @Get('damage-reports')
  listDamageReports(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listDamageReports(req.user.tenantId, {
      status: q.status, carrierId: q.carrierId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.freight_claims.read')
  @Get('damage-reports/:id')
  getDamageReport(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getDamageReport(req.user.tenantId, id);
  }

  @Permissions('inventory.freight_claims.manage')
  @Patch('damage-reports/:id/submit')
  submitDamageReport(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.submitDamageReport(req.user.tenantId, id);
  }

  @Permissions('inventory.freight_claims.manage')
  @Patch('damage-reports/:id/review')
  reviewDamageReport(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { decision: 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED' }) {
    return this.svc.reviewDamageReport(req.user.tenantId, id, req.user.userId, dto.decision);
  }

  // Freight Claims
  @Permissions('inventory.freight_claims.manage')
  @Post('claims')
  fileClaim(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.fileClaim(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.freight_claims.read')
  @Get('claims')
  listClaims(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listClaims(req.user.tenantId, {
      status: q.status, claimType: q.claimType, carrierId: q.carrierId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.freight_claims.read')
  @Get('claims/:id')
  getClaim(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getClaim(req.user.tenantId, id);
  }

  @Permissions('inventory.freight_claims.manage')
  @Patch('claims/:id/status')
  updateClaimStatus(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.svc.updateClaimStatus(req.user.tenantId, id, req.user.userId, dto);
  }

  // Claim Events
  @Permissions('inventory.freight_claims.manage')
  @Post('claims/:id/events')
  addClaimEvent(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { description: string; eventType: string }) {
    return this.svc.addClaimEvent(req.user.tenantId, id, req.user.userId, dto.description, dto.eventType);
  }

  @Permissions('inventory.freight_claims.read')
  @Get('claims/:id/events')
  listClaimEvents(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listClaimEvents(req.user.tenantId, id);
  }
}
