// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { FixedAssetsService } from "./fixed-assets.service";
import { AssetBudgetService } from "./asset-budget.service";
import { AssetDocumentService } from "./asset-document.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

const bulkCreateAssetsSchema = z.object({
  assets: z.array(
    z.object({
      assetCode: z.string().min(1).max(50),
      name: z.string().min(1).max(200),
      purchaseDate: z.string().min(1),
      purchaseValue: z.number().nonnegative(),
      salvageValue: z.number().nonnegative(),
      usefulLifeYears: z.number().int().positive(),
      depreciationMethod: z.string().min(1),
      accountId: z.string().min(1),
      accumDepAccountId: z.string().min(1),
    }),
  ),
});

const bulkDepreciateSchema = z.object({
  assetIds: z.array(z.string().min(1)),
  periodName: z.string().min(1),
});

const bulkTransferSchema = z.object({
  assetIds: z.array(z.string().min(1)),
  transferDate: z.string().min(1),
  toLocationId: z.string().optional(),
  toCustodianId: z.string().optional(),
  reason: z.string().max(2000).optional(),
});

const bulkDisposeSchema = z.object({
  assetIds: z.array(z.string().min(1)),
  disposalDate: z.string().min(1),
  disposalType: z.enum(["SALE", "SCRAP", "DONATION", "THEFT"]),
  reason: z.string().max(2000).optional(),
});

const createBudgetSchema = z.object({
  assetId: z.string().min(1),
  fiscalYear: z.string().min(1),
  allocatedAmount: z.number().nonnegative(),
  spentAmount: z.number().nonnegative().optional(),
  description: z.string().max(2000).optional(),
});

const updateBudgetSchema = z.object({
  allocatedAmount: z.number().nonnegative().optional(),
  spentAmount: z.number().nonnegative().optional(),
});

const createDocumentSchema = z.object({
  assetId: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileUrl: z.string().min(1),
  category: z.string().optional(),
});

@ApiTags("fixed-assets-bulk")
@ApiBearerAuth()
@Controller("fixed-assets-bulk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FixedAssetsBulkController {
  constructor(
    private readonly service: FixedAssetsService,
    private readonly budgetService: AssetBudgetService,
    private readonly documentService: AssetDocumentService,
  ) {}

  @Post("bulk-create")
  @Permissions("fixed-assets.assets.create")
  @ApiOperation({ summary: "Bulk create assets" })
  async bulkCreate(
    @Req() req: AuthReq,
    @ZodBody(bulkCreateAssetsSchema)
    body: z.infer<typeof bulkCreateAssetsSchema>,
  ) {
    const results: any[] = [];
    for (const asset of body.assets) {
      try {
        const created = await this.service.createAsset(
          req.user.tenantId,
          req.user.orgId || "default",
          req.user.userId,
          asset as any,
        );
        results.push({
          assetCode: asset.assetCode,
          status: "created",
          id: created.id,
        });
      } catch (e: any) {
        results.push({
          assetCode: asset.assetCode,
          status: "error",
          message: e.message,
        });
      }
    }
    return {
      results,
      total: body.assets.length,
      succeeded: results.filter((r) => r.status === "created").length,
    };
  }

  @Post("bulk-depreciate")
  @Permissions("fixed-assets.depreciation.create")
  @ApiOperation({ summary: "Bulk post depreciation" })
  async bulkDepreciate(
    @Req() req: AuthReq,
    @ZodBody(bulkDepreciateSchema) body: z.infer<typeof bulkDepreciateSchema>,
  ) {
    const results: any[] = [];
    for (const assetId of body.assetIds) {
      try {
        await this.service.postDepreciation(
          req.user.tenantId,
          req.user.orgId || "default",
          req.user.userId,
          assetId,
          body.periodName,
        );
        results.push({ assetId, status: "depreciated" });
      } catch (e: any) {
        results.push({ assetId, status: "error", message: e.message });
      }
    }
    return {
      results,
      succeeded: results.filter((r) => r.status === "depreciated").length,
    };
  }

  @Post("bulk-transfer")
  @Permissions("fixed-assets.assets.update")
  @ApiOperation({ summary: "Bulk transfer assets" })
  async bulkTransfer(
    @Req() req: AuthReq,
    @ZodBody(bulkTransferSchema) body: z.infer<typeof bulkTransferSchema>,
  ) {
    const results: any[] = [];
    for (const assetId of body.assetIds) {
      try {
        await this.service.transferAsset(
          req.user.tenantId,
          assetId,
          req.user.userId,
          {
            transferDate: body.transferDate,
            toLocationId: body.toLocationId,
            toCustodianId: body.toCustodianId,
            reason: body.reason,
          },
        );
        results.push({ assetId, status: "transferred" });
      } catch (e: any) {
        results.push({ assetId, status: "error", message: e.message });
      }
    }
    return {
      results,
      succeeded: results.filter((r) => r.status === "transferred").length,
    };
  }

  @Post("bulk-dispose")
  @Permissions("fixed-assets.disposals.create")
  @ApiOperation({ summary: "Bulk dispose assets" })
  async bulkDispose(
    @Req() req: AuthReq,
    @ZodBody(bulkDisposeSchema) body: z.infer<typeof bulkDisposeSchema>,
  ) {
    const results: any[] = [];
    for (const assetId of body.assetIds) {
      try {
        await this.service.disposeAsset(
          req.user.tenantId,
          assetId,
          req.user.userId,
          {
            disposalDate: body.disposalDate,
            disposalType: body.disposalType,
            reason: body.reason,
            approvedBy: req.user.userId,
          },
        );
        results.push({ assetId, status: "disposed" });
      } catch (e: any) {
        results.push({ assetId, status: "error", message: e.message });
      }
    }
    return {
      results,
      succeeded: results.filter((r) => r.status === "disposed").length,
    };
  }

  @Get("summary/dashboard")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Dashboard summary" })
  async getDashboardSummary(@Req() req: AuthReq) {
    return this.service.getAssetSummary(req.user.tenantId);
  }

  @Get("summary/by-category")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Assets by category" })
  async getAssetsByCategory(@Req() req: AuthReq) {
    return this.service.getAssetsByCategory(req.user.tenantId);
  }

  @Get("summary/by-status")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Assets by status" })
  async getAssetsByStatus(@Req() req: AuthReq) {
    return this.service.getAssetsByStatus(req.user.tenantId);
  }

  @Get("summary/by-location")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Assets by location" })
  async getAssetsByLocation(@Req() req: AuthReq) {
    return this.service.getAssetsByLocation(req.user.tenantId);
  }

  @Get("depreciation/projection")
  @Permissions("fixed-assets.depreciation.read")
  @ApiOperation({ summary: "Depreciation projection" })
  async getDepreciationProjection(
    @Req() req: AuthReq,
    @Query("months") months?: string,
  ) {
    return this.service.getDepreciationReport(
      req.user.tenantId,
      months || "12",
    );
  }

  @Get("budgets")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "List budgets" })
  async getBudgets(@Req() req: AuthReq, @Query("assetId") assetId?: string) {
    return this.budgetService.getAllocations(
      req.user.tenantId,
      undefined,
      assetId,
    );
  }

  @Post("budgets")
  @Permissions("fixed-assets.assets.create")
  @ApiOperation({ summary: "Create budget allocation" })
  async createBudget(
    @Req() req: AuthReq,
    @ZodBody(createBudgetSchema) body: z.infer<typeof createBudgetSchema>,
  ) {
    return this.budgetService.createAllocationSimple(req.user.tenantId, body);
  }

  @Put("budgets/:id")
  @Permissions("fixed-assets.assets.update")
  @ApiOperation({ summary: "Update budget" })
  async updateBudget(
    @Param("id") id: string,
    @ZodBody(updateBudgetSchema) body: z.infer<typeof updateBudgetSchema>,
  ) {
    return this.budgetService.updateAllocationById(id, body);
  }

  @Delete("budgets/:id")
  @Permissions("fixed-assets.assets.delete")
  @ApiOperation({ summary: "Delete budget" })
  async deleteBudget(@Param("id") id: string) {
    return this.budgetService.deleteAllocation(id);
  }

  @Get("budgets/vs-actuals")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "Budget vs actuals" })
  async getBudgetVsActuals(@Req() req: AuthReq) {
    return this.budgetService.getBudgetSummary(req.user.tenantId);
  }

  @Get("documents")
  @Permissions("fixed-assets.assets.read")
  @ApiOperation({ summary: "List documents" })
  async getDocuments(@Req() req: AuthReq, @Query("assetId") assetId?: string) {
    return this.documentService.getDocuments(req.user.tenantId, assetId);
  }

  @Post("documents")
  @Permissions("fixed-assets.assets.create")
  @ApiOperation({ summary: "Upload document" })
  async createDocument(
    @Req() req: AuthReq,
    @ZodBody(createDocumentSchema) body: z.infer<typeof createDocumentSchema>,
  ) {
    return this.documentService.createDocument(req.user.tenantId, body);
  }

  @Put("documents/:id")
  @Permissions("fixed-assets.assets.update")
  @ApiOperation({ summary: "Update document" })
  async updateDocument(@Req() req: AuthReq, @Param("id") id: string) {
    return this.documentService.updateDocument(id);
  }

  @Delete("documents/:id")
  @Permissions("fixed-assets.assets.delete")
  @ApiOperation({ summary: "Delete document" })
  async deleteDocument(@Req() req: AuthReq, @Param("id") id: string) {
    return this.documentService.deleteDocument(req.user.tenantId, id);
  }
}
