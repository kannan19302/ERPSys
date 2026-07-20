import { Controller, Get, Post, Put, Param, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { FixedAssetsService } from './fixed-assets.service';
import {
  CreateFixedAssetCategoryInput,
  CreateFixedAssetInput,
  UpdateFixedAssetInput,
  TransferFixedAssetInput,
  LogFixedAssetMaintenanceInput,
  createFixedAssetCategorySchema,
  createFixedAssetSchema,
  updateFixedAssetSchema,
  transferFixedAssetSchema,
  logFixedAssetMaintenanceSchema,
} from './fixed-assets.dtos';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const postDepreciationBodySchema = z.object({
  periodName: z.string().min(4).max(10).regex(/^\d{4}-\d{2}$/, 'Period name must be in format YYYY-MM'),
});
type PostDepreciationBody = z.infer<typeof postDepreciationBodySchema>;

@ApiTags('fixed-assets')
@ApiBearerAuth()
@Controller('fixed-assets')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  // ─── CATEGORY ENDPOINTS ────────────────────────────

  @Get('categories')
  @Permissions('assets.category.manage')
  @ApiOperation({ summary: 'List all asset categories' })
  async getCategories(@Req() req: AuthenticatedRequest) {
    return this.fixedAssetsService.getCategories(req.user.tenantId);
  }

  @Post('categories')
  @Permissions('assets.category.manage')
  @ApiOperation({ summary: 'Create an asset category' })
  async createCategory(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFixedAssetCategorySchema) body: CreateFixedAssetCategoryInput
  ) {
    return this.fixedAssetsService.createCategory(req.user.tenantId, body);
  }

  // ─── ASSET REGISTRY ENDPOINTS ──────────────────────

  @Get()
  @Permissions('assets.asset.read')
  @ApiOperation({ summary: 'List fixed assets with optional filters' })
  async getAssets(
    @Req() req: AuthenticatedRequest,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string
  ) {
    return this.fixedAssetsService.getAssets(req.user.tenantId, { categoryId, status, locationId });
  }

  @Get(':id')
  @Permissions('assets.asset.read')
  @ApiOperation({ summary: 'Retrieve asset details by ID' })
  async getAssetById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fixedAssetsService.getAssetById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('assets.asset.create')
  @ApiOperation({ summary: 'Register a new fixed asset' })
  async createAsset(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFixedAssetSchema) body: CreateFixedAssetInput
  ) {
    const orgId = req.user.orgId;
    if (!orgId) {
      throw new BadRequestException('User session is missing orgId scope.');
    }
    return this.fixedAssetsService.createAsset(req.user.tenantId, orgId, req.user.userId, body);
  }

  @Put(':id')
  @Permissions('assets.asset.update')
  @ApiOperation({ summary: 'Update asset details' })
  async updateAsset(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateFixedAssetSchema) body: UpdateFixedAssetInput
  ) {
    return this.fixedAssetsService.updateAsset(req.user.tenantId, id, req.user.userId, body);
  }

  // ─── CUSTODY / LOCATION TRANSFER ──────────────────

  @Post(':id/transfer')
  @Permissions('assets.transfer.manage')
  @ApiOperation({ summary: 'Record an asset location or custodian transfer' })
  async transferAsset(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(transferFixedAssetSchema) body: TransferFixedAssetInput
  ) {
    return this.fixedAssetsService.transferAsset(req.user.tenantId, id, req.user.userId, body);
  }

  // ─── MAINTENANCE RECORDING ────────────────────────

  @Post(':id/maintenance')
  @Permissions('assets.maintenance.manage')
  @ApiOperation({ summary: 'Log a maintenance event for a fixed asset' })
  async logMaintenance(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(logFixedAssetMaintenanceSchema) body: LogFixedAssetMaintenanceInput
  ) {
    return this.fixedAssetsService.logMaintenance(req.user.tenantId, id, req.user.userId, body);
  }

  // ─── DEPRECIATION RUNS ────────────────────────────

  @Post(':id/depreciate')
  @Permissions('assets.depreciation.post')
  @ApiOperation({ summary: 'Calculate and post depreciation for a single asset' })
  async postDepreciation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(postDepreciationBodySchema) body: PostDepreciationBody
  ) {
    const orgId = req.user.orgId;
    if (!orgId) {
      throw new BadRequestException('User session is missing orgId scope.');
    }
    return this.fixedAssetsService.postDepreciation(req.user.tenantId, orgId, req.user.userId, id, body.periodName);
  }
}
