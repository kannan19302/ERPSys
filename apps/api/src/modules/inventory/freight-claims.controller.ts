import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FreightClaimsService } from './freight-claims.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('inventory/freight-claims')
export class FreightClaimsController {
  constructor(private readonly svc: FreightClaimsService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Damage Reports
  @Post('damage-reports')
  createDamageReport(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createDamageReport(req.user.tenantId, req.user.userId, dto);
  }

  @Get('damage-reports')
  listDamageReports(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listDamageReports(req.user.tenantId, {
      status: q.status, carrierId: q.carrierId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Get('damage-reports/:id')
  getDamageReport(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getDamageReport(req.user.tenantId, id);
  }

  @Patch('damage-reports/:id/submit')
  submitDamageReport(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.submitDamageReport(req.user.tenantId, id);
  }

  @Patch('damage-reports/:id/review')
  reviewDamageReport(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { decision: 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED' }) {
    return this.svc.reviewDamageReport(req.user.tenantId, id, req.user.userId, dto.decision);
  }

  // Freight Claims
  @Post('claims')
  fileClaim(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.fileClaim(req.user.tenantId, req.user.userId, dto);
  }

  @Get('claims')
  listClaims(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listClaims(req.user.tenantId, {
      status: q.status, claimType: q.claimType, carrierId: q.carrierId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Get('claims/:id')
  getClaim(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getClaim(req.user.tenantId, id);
  }

  @Patch('claims/:id/status')
  updateClaimStatus(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.svc.updateClaimStatus(req.user.tenantId, id, req.user.userId, dto);
  }

  // Claim Events
  @Post('claims/:id/events')
  addClaimEvent(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { description: string; eventType: string }) {
    return this.svc.addClaimEvent(req.user.tenantId, id, req.user.userId, dto.description, dto.eventType);
  }

  @Get('claims/:id/events')
  listClaimEvents(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listClaimEvents(req.user.tenantId, id);
  }
}
