import { Controller, Get, Post, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { CrossDockService } from '../services/cross-dock.service';
import {
  createCrossDockStationSchema,
  createCrossDockOrderSchema,
  updateCrossDockOrderStatusSchema,
  CreateCrossDockStationDto,
  CreateCrossDockOrderDto,
  UpdateCrossDockOrderStatusDto,
} from '../dto/supply-chain.dto';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain/cross-dock')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrossDockStationController {
  constructor(private readonly crossDockService: CrossDockService) {}

  @Get('stations')
  @Permissions('supply-chain.shipment.read')
  @ApiOperation({ summary: 'List cross-dock stations' })
  async listStations(
    @Req() req: AuthenticatedRequest,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.crossDockService.listStations(req.user.tenantId, warehouseId);
  }

  @Post('stations')
  @Permissions('supply-chain.shipment.create')
  @ApiOperation({ summary: 'Create cross-dock station' })
  async createStation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCrossDockStationSchema) dto: CreateCrossDockStationDto,
  ) {
    return this.crossDockService.createStation(req.user.tenantId, dto);
  }
}

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain/cross-dock')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrossDockOrderController {
  constructor(private readonly crossDockService: CrossDockService) {}

  @Get('orders')
  @Permissions('supply-chain.shipment.read')
  @ApiOperation({ summary: 'List cross-dock orders' })
  async listOrders(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.crossDockService.listOrders(req.user.tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      warehouseId,
    });
  }

  @Get('orders/:id')
  @Permissions('supply-chain.shipment.read')
  @ApiOperation({ summary: 'Get cross-dock order by id' })
  async getOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.crossDockService.getOrderById(req.user.tenantId, id);
  }

  @Post('orders')
  @Permissions('supply-chain.shipment.create')
  @ApiOperation({ summary: 'Create cross-dock order' })
  async createOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCrossDockOrderSchema) dto: CreateCrossDockOrderDto,
  ) {
    return this.crossDockService.createOrder(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Patch('orders/:id/status')
  @Permissions('supply-chain.shipment.update')
  @ApiOperation({ summary: 'Update cross-dock order status' })
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateCrossDockOrderStatusSchema) dto: UpdateCrossDockOrderStatusDto,
  ) {
    return this.crossDockService.updateOrderStatus(req.user.tenantId, id, dto, req.user.userId || 'system');
  }
}
