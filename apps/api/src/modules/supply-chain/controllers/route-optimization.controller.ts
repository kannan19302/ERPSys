import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { RouteOptimizationService } from '../services/route-optimization.service';
import { optimizeRouteSchema, OptimizeRouteDto, routeEstimateSchema, RouteEstimateDto } from '../dto/supply-chain.dto';

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain/routes')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RouteOptimizationController {
  constructor(private readonly routeOptService: RouteOptimizationService) {}

  @Post('optimize')
  @Permissions('supply-chain.route.read')
  @ApiOperation({ summary: 'Optimize delivery route (nearest-neighbor heuristic)' })
  async optimize(@ZodBody(optimizeRouteSchema) dto: OptimizeRouteDto) {
    return this.routeOptService.optimizeRoute(dto.stops, dto.startLat || 0, dto.startLng || 0);
  }

  @Post('estimate')
  @Permissions('supply-chain.route.read')
  @ApiOperation({ summary: 'Estimate distance between two points (Haversine)' })
  async estimate(@ZodBody(routeEstimateSchema) dto: RouteEstimateDto) {
    const { haversine } = this.routeOptService;
    const distance = haversine(dto.lat1, dto.lng1, dto.lat2, dto.lng2);
    return {
      origin: { lat: dto.lat1, lng: dto.lng1 },
      destination: { lat: dto.lat2, lng: dto.lng2 },
      distanceKm: Math.round(distance * 100) / 100,
    };
  }
}
