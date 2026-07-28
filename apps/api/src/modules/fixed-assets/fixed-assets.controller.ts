import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { FixedAssetsService } from "./fixed-assets.service";
import { AssetDepreciationService } from "./asset-depreciation.service";
import { AssetMaintenanceService } from "./asset-maintenance.service";
import {
  CreateFixedAssetCategoryInput,
  CreateFixedAssetInput,
  UpdateFixedAssetInput,
  TransferFixedAssetInput,
  LogFixedAssetMaintenanceInput,
  DisposeFixedAssetInput,
  createFixedAssetCategorySchema,
  createFixedAssetSchema,
  updateFixedAssetSchema,
  transferFixedAssetSchema,
  logFixedAssetMaintenanceSchema,
  disposeFixedAssetSchema,
  createDepreciationScheduleSchema,
  postDepreciationSchema,
} from "./fixed-assets.dtos";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("fixed-assets")
@ApiBearerAuth()
@Controller("fixed-assets")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FixedAssetsController {
  constructor(
    private readonly service: FixedAssetsService,
    private readonly depreciationService: AssetDepreciationService,
    private readonly maintenanceService: AssetMaintenanceService,
  ) {}

  @Get("depreciation-schedules")
  @Permissions("fixed-assets.depreciation.read")
  @ApiOperation({ summary: "List depreciation schedule details" })
  async getDepreciationSchedules(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.depreciationService.getSchedules(req.user.tenantId, query);
  }

  @Post("depreciation-schedules")
  @Permissions("fixed-assets.depreciation.create")
  @ApiOperation({ summary: "Create depreciation schedule entry" })
  async createDepreciationSchedule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDepreciationScheduleSchema) body: any,
  ) {
    return this.depreciationService.createSchedule(req.user.tenantId, body);
  }

  @Get("maintenance-schedules")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "List planned maintenance schedules" })
  async getMaintenanceSchedules(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.maintenanceService.getMaintenanceSchedules(
      req.user.tenantId,
      query,
    );
  }

  // ─── CATEGORY ──────────────────────────────────────

  @Get("categories")
  @Permissions("fixed-assets.categories.read")
  @ApiOperation({ summary: "List asset categories" })
  async getCategories(@Req() req: AuthenticatedRequest) {
    return this.service.getCategories(req.user.tenantId);
  }

  @Post("categories")
  @Permissions("fixed-assets.categories.create")
  @ApiOperation({ summary: "Create asset category" })
  async createCategory(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFixedAssetCategorySchema)
    body: CreateFixedAssetCategoryInput,
  ) {
    return this.service.createCategory(req.user.tenantId, body);
  }

  // ─── ASSETS ─────────────────────────────────────────

  @Get()
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "List fixed assets" })
  async getAssets(
    @Req() req: AuthenticatedRequest,
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: string,
    @Query("locationId") locationId?: string,
  ) {
    return this.service.getAssets(req.user.tenantId, {
      categoryId,
      status,
      locationId,
    });
  }

  @Get(":id")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Get asset by ID" })
  async getAssetById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getAssetById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("fixed-assets.assets.create")
  @ApiOperation({ summary: "Create fixed asset" })
  async createAsset(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFixedAssetSchema) body: CreateFixedAssetInput,
  ) {
    const orgId = req.user.orgId;
    if (!orgId)
      throw new BadRequestException("User session is missing orgId scope.");
    return this.service.createAsset(
      req.user.tenantId,
      orgId,
      req.user.userId,
      body,
    );
  }

  @Put(":id")
  @Permissions("fixed-assets.assets.update")
  @ApiOperation({ summary: "Update asset" })
  async updateAsset(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateFixedAssetSchema) body: UpdateFixedAssetInput,
  ) {
    return this.service.updateAsset(
      req.user.tenantId,
      id,
      req.user.userId,
      body,
    );
  }

  // ─── TRANSFERS ──────────────────────────────────────

  @Post(":id/transfer")
  @Permissions("fixed-assets.assets.update")
  @ApiOperation({ summary: "Transfer asset" })
  async transferAsset(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(transferFixedAssetSchema) body: TransferFixedAssetInput,
  ) {
    return this.service.transferAsset(
      req.user.tenantId,
      id,
      req.user.userId,
      body,
    );
  }

  // ─── MAINTENANCE ────────────────────────────────────

  @Post(":id/maintenance")
  @Permissions("fixed-assets.assets.update")
  @ApiOperation({ summary: "Log maintenance" })
  async logMaintenance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(logFixedAssetMaintenanceSchema)
    body: LogFixedAssetMaintenanceInput,
  ) {
    return this.service.logMaintenance(
      req.user.tenantId,
      id,
      req.user.userId,
      body,
    );
  }

  // ─── DEPRECIATION ───────────────────────────────────

  @Post(":id/depreciate")
  @Permissions("fixed-assets.depreciation.create")
  @ApiOperation({ summary: "Post depreciation" })
  async postDepreciation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(postDepreciationSchema) body: { periodName: string },
  ) {
    const orgId = req.user.orgId;
    if (!orgId)
      throw new BadRequestException("User session is missing orgId scope.");
    return this.service.postDepreciation(
      req.user.tenantId,
      orgId,
      req.user.userId,
      id,
      body.periodName,
    );
  }

  // ─── DISPOSAL ───────────────────────────────────────

  @Get("disposals")
  @Permissions("fixed-assets.disposals.read")
  @ApiOperation({ summary: "List disposals" })
  async getDisposals(
    @Req() req: AuthenticatedRequest,
    @Query("assetId") assetId?: string,
  ) {
    return this.service.getDisposals(req.user.tenantId, assetId);
  }

  @Post(":id/dispose")
  @Permissions("fixed-assets.disposals.create")
  @ApiOperation({ summary: "Dispose asset" })
  async disposeAsset(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(disposeFixedAssetSchema) body: DisposeFixedAssetInput,
  ) {
    return this.service.disposeAsset(
      req.user.tenantId,
      id,
      req.user.userId,
      body,
    );
  }

  // ─── AUDIT LOG ──────────────────────────────────────

  @Get("audit-log")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Get audit logs" })
  async getAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Query("assetId") assetId?: string,
  ) {
    return this.service.getAuditLogs(req.user.tenantId, assetId);
  }

  // ─── REPORTS ────────────────────────────────────────

  @Get("reports/depreciation")
  @Permissions("fixed-assets.depreciation.read")
  @ApiOperation({ summary: "Depreciation report" })
  async getDepreciationReport(
    @Req() req: AuthenticatedRequest,
    @Query("periodName") periodName?: string,
  ) {
    return this.service.getDepreciationReport(req.user.tenantId, periodName);
  }

  @Get("reports/summary")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Asset summary" })
  async getAssetSummary(@Req() req: AuthenticatedRequest) {
    return this.service.getAssetSummary(req.user.tenantId);
  }

  @Get("reports/maintenance")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Maintenance report" })
  async getMaintenanceReport(@Req() req: AuthenticatedRequest) {
    return this.service.getMaintenanceReport(req.user.tenantId);
  }
}
