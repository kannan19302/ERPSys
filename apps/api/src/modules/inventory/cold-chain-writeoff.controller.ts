import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ColdChainWriteoffService } from './cold-chain-writeoff.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@ApiTags('inventory-cold-chain-writeoff')
@UseGuards(JwtAuthGuard)
@Controller('api/inventory/cold-chain-writeoff')
export class ColdChainWriteoffController {
  constructor(private readonly svc: ColdChainWriteoffService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Cold chain & write-off dashboard' })
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Cold Chain Requirements

  @Get('requirements')
  @ApiOperation({ summary: 'List cold-chain requirements' })
  listRequirements(@Request() req: AuthRequest, @Query('productId') productId?: string) {
    return this.svc.listRequirements(req.user.tenantId, productId);
  }

  @Post('requirements')
  @ApiOperation({ summary: 'Upsert cold-chain requirement for a product' })
  upsertRequirement(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertRequirement(req.user.tenantId, body);
  }

  @Delete('requirements/:productId')
  @ApiOperation({ summary: 'Deactivate cold-chain requirement' })
  deactivateRequirement(@Request() req: AuthRequest, @Param('productId') productId: string) {
    return this.svc.deactivateRequirement(req.user.tenantId, productId);
  }

  @Get('requirements/:productId/compliance')
  @ApiOperation({ summary: 'Check product cold-chain compliance' })
  checkCompliance(@Request() req: AuthRequest, @Param('productId') productId: string) {
    return this.svc.checkProductCompliance(req.user.tenantId, productId);
  }

  // Temperature Excursions

  @Get('excursions')
  @ApiOperation({ summary: 'List temperature excursions' })
  listExcursions(@Request() req: AuthRequest, @Query('status') status?: string, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listExcursions(req.user.tenantId, status, warehouseId);
  }

  @Post('excursions')
  @ApiOperation({ summary: 'Log a temperature excursion' })
  logExcursion(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.logExcursion(req.user.tenantId, { ...body, loggedById: req.user.userId });
  }

  @Patch('excursions/:id/review')
  @ApiOperation({ summary: 'Review/update excursion status' })
  reviewExcursion(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.reviewExcursion(req.user.tenantId, id, { ...body, reviewedById: req.user.userId });
  }

  @Get('excursions/summary')
  @ApiOperation({ summary: 'Excursion summary counts' })
  getExcursionSummary(@Request() req: AuthRequest) {
    return this.svc.getExcursionSummary(req.user.tenantId);
  }

  // Write-Down Requests

  @Get('write-downs')
  @ApiOperation({ summary: 'List stock write-down requests' })
  listWriteDowns(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listWriteDowns(req.user.tenantId, status);
  }

  @Post('write-downs')
  @ApiOperation({ summary: 'Create write-down request' })
  createWriteDown(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createWriteDown(req.user.tenantId, { ...body, requestedById: req.user.userId });
  }

  @Patch('write-downs/:id/approve')
  @ApiOperation({ summary: 'Approve write-down request' })
  approveWriteDown(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveWriteDown(req.user.tenantId, id, req.user.userId);
  }

  @Patch('write-downs/:id/reject')
  @ApiOperation({ summary: 'Reject write-down request' })
  rejectWriteDown(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: { rejectionNotes: string }) {
    return this.svc.rejectWriteDown(req.user.tenantId, id, body.rejectionNotes);
  }

  @Patch('write-downs/:id/apply')
  @ApiOperation({ summary: 'Apply approved write-down' })
  applyWriteDown(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.applyWriteDown(req.user.tenantId, id);
  }

  // Write-Off Records

  @Get('write-offs')
  @ApiOperation({ summary: 'List stock write-off records' })
  listWriteOffs(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listWriteOffs(req.user.tenantId, status);
  }

  @Post('write-offs')
  @ApiOperation({ summary: 'Create write-off record' })
  createWriteOff(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createWriteOff(req.user.tenantId, { ...body, requestedById: req.user.userId });
  }

  @Patch('write-offs/:id/approve')
  @ApiOperation({ summary: 'Approve write-off' })
  approveWriteOff(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveWriteOff(req.user.tenantId, id, req.user.userId);
  }

  @Patch('write-offs/:id/reject')
  @ApiOperation({ summary: 'Reject write-off' })
  rejectWriteOff(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: { rejectionNotes: string }) {
    return this.svc.rejectWriteOff(req.user.tenantId, id, body.rejectionNotes);
  }

  @Patch('write-offs/:id/complete')
  @ApiOperation({ summary: 'Complete (execute) write-off' })
  completeWriteOff(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.completeWriteOff(req.user.tenantId, id);
  }
}
