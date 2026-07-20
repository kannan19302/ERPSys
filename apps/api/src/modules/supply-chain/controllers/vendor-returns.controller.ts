import { Controller, Get, Post, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { VendorReturnsService } from '../services/vendor-returns.service';
import {
  createVendorReturnSchema,
  updateVendorReturnStatusSchema,
  CreateVendorReturnDto,
  UpdateVendorReturnStatusDto,
} from '../dto/supply-chain.dto';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain/vendor-returns')
@UseGuards(JwtAuthGuard, RbacGuard)
export class VendorReturnsController {
  constructor(private readonly vendorReturnsService: VendorReturnsService) {}

  @Get()
  @Permissions('supply-chain.shipment.read')
  @ApiOperation({ summary: 'List vendor return shipments' })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.vendorReturnsService.list(req.user.tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('stats')
  @Permissions('supply-chain.shipment.read')
  @ApiOperation({ summary: 'Get vendor return statistics' })
  async stats(@Req() req: AuthenticatedRequest) {
    return this.vendorReturnsService.getStats(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('supply-chain.shipment.read')
  @ApiOperation({ summary: 'Get vendor return by id' })
  async getById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.vendorReturnsService.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('supply-chain.shipment.create')
  @ApiOperation({ summary: 'Create vendor return shipment' })
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createVendorReturnSchema) dto: CreateVendorReturnDto) {
    return this.vendorReturnsService.create(req.user.tenantId, dto);
  }

  @Patch(':id/status')
  @Permissions('supply-chain.shipment.update')
  @ApiOperation({ summary: 'Update vendor return status' })
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateVendorReturnStatusSchema) dto: UpdateVendorReturnStatusDto,
  ) {
    return this.vendorReturnsService.updateStatus(req.user.tenantId, id, dto);
  }
}
