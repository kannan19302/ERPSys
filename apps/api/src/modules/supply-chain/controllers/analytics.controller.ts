import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { SupplyChainAnalyticsService } from '../services/analytics.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain/analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainAnalyticsController {
  constructor(private readonly analyticsService: SupplyChainAnalyticsService) {}

  @Get('dashboard')
  @Permissions('supply-chain.forecast.read')
  @ApiOperation({ summary: 'Get supply chain dashboard KPIs' })
  async dashboard(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getDashboard(req.user.tenantId);
  }

  @Get('carrier-performance')
  @Permissions('supply-chain.forecast.read')
  @ApiOperation({ summary: 'Get carrier performance scorecard' })
  async carrierPerformance(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getCarrierPerformance(req.user.tenantId);
  }

  @Get('on-time-delivery')
  @Permissions('supply-chain.forecast.read')
  @ApiOperation({ summary: 'Get on-time delivery rate' })
  async onTimeDelivery(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getOnTimeDelivery(req.user.tenantId);
  }

  @Get('cost-analysis')
  @Permissions('supply-chain.forecast.read')
  @ApiOperation({ summary: 'Get shipping cost analysis' })
  async costAnalysis(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getCostAnalysis(req.user.tenantId);
  }

  @Get('lead-time')
  @Permissions('supply-chain.forecast.read')
  @ApiOperation({ summary: 'Get lead time metrics' })
  async leadTime(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getLeadTime(req.user.tenantId);
  }
}
