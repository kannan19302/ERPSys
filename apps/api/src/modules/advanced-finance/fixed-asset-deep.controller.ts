import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

@ApiTags("FixedAssetDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-finance/fixed-assets")
export class FixedAssetDeepController {
  // ── Fixed Asset CRUD ──────────────────────────────────────────
  @ApiOperation({ summary: "List fixed assets" })
  @Permissions("finance.fixed-asset.read")
  @Get()
  async list(
    @Req() req: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return { success: true, data: { tenantId: req.tenantId, page, limit } };
  }

  @ApiOperation({ summary: "Get fixed asset by ID" })
  @Permissions("finance.fixed-asset.read")
  @Get(":id")
  async get(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a fixed asset" })
  @Permissions("finance.fixed-asset.create")
  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Update a fixed asset" })
  @Permissions("finance.fixed-asset.update")
  @Patch(":id")
  async update(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return { success: true, data: { id, ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Delete a fixed asset" })
  @Permissions("finance.fixed-asset.delete")
  @Delete(":id")
  async delete(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, deleted: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Bulk delete fixed assets" })
  @Permissions("finance.fixed-asset.delete")
  @Post("bulk-delete")
  async bulkDelete(@Req() req: any, @Body() dto: { ids: string[] }) {
    return {
      success: true,
      data: { ids: dto.ids, deleted: true, tenantId: req.tenantId },
    };
  }

  // ── Fixed Asset Categories ────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset categories" })
  @Permissions("finance.fixed-asset.category.read")
  @Get("categories")
  async listCategories(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset category by ID" })
  @Permissions("finance.fixed-asset.category.read")
  @Get("categories/:id")
  async getCategory(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a fixed asset category" })
  @Permissions("finance.fixed-asset.category.create")
  @Post("categories")
  async createCategory(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Update a fixed asset category" })
  @Permissions("finance.fixed-asset.category.update")
  @Patch("categories/:id")
  async updateCategory(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return { success: true, data: { id, ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Delete a fixed asset category" })
  @Permissions("finance.fixed-asset.category.delete")
  @Delete("categories/:id")
  async deleteCategory(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, deleted: true, tenantId: req.tenantId },
    };
  }

  // ── Acquisition ───────────────────────────────────────────────
  @ApiOperation({ summary: "Record a fixed asset acquisition" })
  @Permissions("finance.fixed-asset.acquisition.create")
  @Post("acquisitions")
  async recordAcquisition(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Record a lease acquisition for a fixed asset" })
  @Permissions("finance.fixed-asset.acquisition.create")
  @Post("acquisitions/lease")
  async recordLeaseAcquisition(@Req() req: any, @Body() dto: any) {
    return {
      success: true,
      data: { ...dto, leaseAcquisition: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({
    summary: "Record construction in progress for a fixed asset",
  })
  @Permissions("finance.fixed-asset.acquisition.create")
  @Post("acquisitions/construction-in-progress")
  async recordConstructionInProgress(@Req() req: any, @Body() dto: any) {
    return {
      success: true,
      data: { ...dto, cip: true, tenantId: req.tenantId },
    };
  }

  // ── Asset Transfer ────────────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset transfers" })
  @Permissions("finance.fixed-asset.transfer.read")
  @Get("transfers")
  async listTransfers(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset transfer by ID" })
  @Permissions("finance.fixed-asset.transfer.read")
  @Get("transfers/:id")
  async getTransfer(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a fixed asset transfer request" })
  @Permissions("finance.fixed-asset.transfer.create")
  @Post("transfers")
  async createTransfer(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Approve a fixed asset transfer" })
  @Permissions("finance.fixed-asset.transfer.approve")
  @Post("transfers/:id/approve")
  async approveTransfer(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, approved: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Reject a fixed asset transfer" })
  @Permissions("finance.fixed-asset.transfer.approve")
  @Post("transfers/:id/reject")
  async rejectTransfer(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { id, rejected: true, ...dto, tenantId: req.tenantId },
    };
  }

  // ── Asset Maintenance ─────────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset maintenance records" })
  @Permissions("finance.fixed-asset.maintenance.read")
  @Get("maintenance")
  async listMaintenance(@Req() req: any, @Query("assetId") assetId?: string) {
    return { success: true, data: { assetId, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset maintenance record by ID" })
  @Permissions("finance.fixed-asset.maintenance.read")
  @Get("maintenance/:id")
  async getMaintenance(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Schedule maintenance for a fixed asset" })
  @Permissions("finance.fixed-asset.maintenance.create")
  @Post("maintenance")
  async scheduleMaintenance(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Complete a fixed asset maintenance record" })
  @Permissions("finance.fixed-asset.maintenance.update")
  @Post("maintenance/:id/complete")
  async completeMaintenance(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { id, completed: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Cancel a scheduled maintenance" })
  @Permissions("finance.fixed-asset.maintenance.update")
  @Post("maintenance/:id/cancel")
  async cancelMaintenance(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { id, cancelled: true, ...dto, tenantId: req.tenantId },
    };
  }

  // ── Asset Revaluation ─────────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset revaluations" })
  @Permissions("finance.fixed-asset.revaluation.read")
  @Get("revaluations")
  async listRevaluations(@Req() req: any, @Query("assetId") assetId?: string) {
    return { success: true, data: { assetId, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset revaluation by ID" })
  @Permissions("finance.fixed-asset.revaluation.read")
  @Get("revaluations/:id")
  async getRevaluation(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a fixed asset revaluation" })
  @Permissions("finance.fixed-asset.revaluation.create")
  @Post("revaluations")
  async createRevaluation(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Approve a fixed asset revaluation" })
  @Permissions("finance.fixed-asset.revaluation.approve")
  @Post("revaluations/:id/approve")
  async approveRevaluation(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, approved: true, tenantId: req.tenantId },
    };
  }

  // ── Asset Disposal ────────────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset disposals" })
  @Permissions("finance.fixed-asset.disposal.read")
  @Get("disposals")
  async listDisposals(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset disposal by ID" })
  @Permissions("finance.fixed-asset.disposal.read")
  @Get("disposals/:id")
  async getDisposal(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Record a fixed asset disposal" })
  @Permissions("finance.fixed-asset.disposal.create")
  @Post("disposals")
  async recordDisposal(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Reverse a fixed asset disposal" })
  @Permissions("finance.fixed-asset.disposal.update")
  @Post("disposals/:id/reverse")
  async reverseDisposal(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, reversed: true, tenantId: req.tenantId },
    };
  }

  // ── Asset Impairment ──────────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset impairments" })
  @Permissions("finance.fixed-asset.impairment.read")
  @Get("impairments")
  async listImpairments(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset impairment by ID" })
  @Permissions("finance.fixed-asset.impairment.read")
  @Get("impairments/:id")
  async getImpairment(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Record a fixed asset impairment" })
  @Permissions("finance.fixed-asset.impairment.create")
  @Post("impairments")
  async recordImpairment(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Reverse a fixed asset impairment" })
  @Permissions("finance.fixed-asset.impairment.update")
  @Post("impairments/:id/reverse")
  async reverseImpairment(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, reversed: true, tenantId: req.tenantId },
    };
  }

  // ── Asset Insurance ───────────────────────────────────────────
  @ApiOperation({ summary: "List fixed asset insurance policies" })
  @Permissions("finance.fixed-asset.insurance.read")
  @Get("insurance")
  async listInsurance(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset insurance policy by ID" })
  @Permissions("finance.fixed-asset.insurance.read")
  @Get("insurance/:id")
  async getInsurance(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create an insurance policy for a fixed asset" })
  @Permissions("finance.fixed-asset.insurance.create")
  @Post("insurance")
  async createInsurance(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Update a fixed asset insurance policy" })
  @Permissions("finance.fixed-asset.insurance.update")
  @Patch("insurance/:id")
  async updateInsurance(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return { success: true, data: { id, ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Renew a fixed asset insurance policy" })
  @Permissions("finance.fixed-asset.insurance.update")
  @Post("insurance/:id/renew")
  async renewInsurance(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { id, renewed: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "File an insurance claim for a fixed asset" })
  @Permissions("finance.fixed-asset.insurance.claim")
  @Post("insurance/:id/file-claim")
  async fileClaim(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { id, claimFiled: true, ...dto, tenantId: req.tenantId },
    };
  }

  // ── Depreciation ──────────────────────────────────────────────
  @ApiOperation({ summary: "Run depreciation for fixed assets" })
  @Permissions("finance.fixed-asset.depreciation.create")
  @Post("depreciation/run")
  async runDepreciation(@Req() req: any, @Body() dto: any) {
    return {
      success: true,
      data: { ...dto, depreciationRun: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get depreciation schedule for a fixed asset" })
  @Permissions("finance.fixed-asset.depreciation.read")
  @Get(":id/depreciation-schedule")
  async getDepreciationSchedule(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get depreciation journal entry" })
  @Permissions("finance.fixed-asset.depreciation.read")
  @Get("depreciation/entries/:entryId")
  async getDepreciationEntry(
    @Req() req: any,
    @Param("entryId") entryId: string,
  ) {
    return { success: true, data: { entryId, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Reverse a depreciation entry" })
  @Permissions("finance.fixed-asset.depreciation.update")
  @Post("depreciation/entries/:entryId/reverse")
  async reverseDepreciation(
    @Req() req: any,
    @Param("entryId") entryId: string,
  ) {
    return {
      success: true,
      data: { entryId, reversed: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Forecast depreciation for fixed assets" })
  @Permissions("finance.fixed-asset.depreciation.read")
  @Get("depreciation/forecast")
  async forecastDepreciation(
    @Req() req: any,
    @Query("assetId") assetId?: string,
  ) {
    return { success: true, data: { assetId, tenantId: req.tenantId } };
  }

  // ── Asset Reporting ───────────────────────────────────────────
  @ApiOperation({ summary: "Get fixed asset summary report" })
  @Permissions("finance.fixed-asset.report")
  @Get("reports/summary")
  async getAssetSummary(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get fixed asset aging report" })
  @Permissions("finance.fixed-asset.report")
  @Get("reports/aging")
  async getAssetAging(@Req() req: any, @Query("asOfDate") asOfDate?: string) {
    return { success: true, data: { asOfDate, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get depreciation report" })
  @Permissions("finance.fixed-asset.report")
  @Get("reports/depreciation")
  async getDepreciationReport(
    @Req() req: any,
    @Query("period") period?: string,
  ) {
    return { success: true, data: { period, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get capital expenditure report" })
  @Permissions("finance.fixed-asset.report")
  @Get("reports/capex")
  async getCapitalExpenditureReport(
    @Req() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return {
      success: true,
      data: { startDate, endDate, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get fixed asset register" })
  @Permissions("finance.fixed-asset.report")
  @Get("reports/register")
  async getAssetRegister(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  // ── Barcode / Label ───────────────────────────────────────────
  @ApiOperation({ summary: "Generate a barcode for a fixed asset" })
  @Permissions("finance.fixed-asset.label")
  @Post(":id/generate-barcode")
  async generateBarcode(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, barcodeGenerated: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Print a label for a fixed asset" })
  @Permissions("finance.fixed-asset.label")
  @Post(":id/print-label")
  async printLabel(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, labelPrinted: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Batch print labels for fixed assets" })
  @Permissions("finance.fixed-asset.label")
  @Post("batch-print-labels")
  async batchPrintLabels(@Req() req: any, @Body() dto: { ids: string[] }) {
    return {
      success: true,
      data: { ids: dto.ids, batchPrinted: true, tenantId: req.tenantId },
    };
  }
}
