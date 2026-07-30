// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SalesDeepeningApexFinalService } from "./sales-deepening-apex-final.service";

@ApiTags("Sales Deepening Apex Final")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/apex-final")
export class SalesDeepeningApexFinalController {
  constructor(private readonly service: SalesDeepeningApexFinalService) {}

  // 25 Final Apex Endpoints
  @Get("deep-seal-checkpoints")
  @ApiOperation({ summary: "List deep-seal-checkpoints" })
  @Permissions("sales.seal.read")
  async listSealCheckpoints(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchFinalApexView(u.tenantId, "seal-checkpoints", q);
  }
  @Post("deep-seal-checkpoints")
  @ApiOperation({ summary: "Create deep-seal-checkpoints" })
  @Permissions("sales.seal.write")
  async createSealCheckpoint(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "create-seal-checkpoint",
      b,
    );
  }
  @Get("deep-seal-checkpoints/:id")
  @ApiOperation({ summary: "Get seal checkpoint by ID" })
  @Permissions("sales.seal.read")
  async getSealCheckpointById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.fetchFinalApexView(u.tenantId, "seal-checkpoints", {
      id,
    });
  }
  @Patch("deep-seal-checkpoints/:id")
  @ApiOperation({ summary: "Update seal checkpoint" })
  @Permissions("sales.seal.write")
  async updateSealCheckpoint(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "update-seal-checkpoint",
      { id, ...b },
    );
  }
  @Delete("deep-seal-checkpoints/:id")
  @ApiOperation({ summary: "Delete seal checkpoint" })
  @Permissions("sales.seal.write")
  async deleteSealCheckpoint(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "delete-seal-checkpoint",
      { id },
    );
  }
  @Post("deep-seal-checkpoints/:id/verify")
  @ApiOperation({ summary: "Verify seal checkpoint" })
  @Permissions("sales.seal.approve")
  async verifySealCheckpoint(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "verify-seal-checkpoint",
      { id },
    );
  }
  @Post("deep-seal-checkpoints/:id/certify")
  @ApiOperation({ summary: "Certify seal checkpoint" })
  @Permissions("sales.seal.approve")
  async certifySealCheckpoint(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "certify-seal-checkpoint",
      { id },
    );
  }
  @Get("deep-seal-checkpoints/metrics/integrity")
  @ApiOperation({ summary: "Get seal integrity metrics" })
  @Permissions("sales.seal.read")
  async integritySealCheckpoint(@CurrentUser() u: any) {
    return this.service.fetchFinalApexView(
      u.tenantId,
      "seal-integrity-metrics",
      {},
    );
  }
  @Post("deep-seal-checkpoints/batch-verify")
  @ApiOperation({ summary: "Batch verify seal checkpoints" })
  @Permissions("sales.seal.write")
  async batchVerifySealCheckpoint(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "batch-verify-seal-checkpoints",
      b,
    );
  }
  @Get("deep-seal-checkpoints/export/certificate")
  @ApiOperation({ summary: "Export seal certificate" })
  @Permissions("sales.seal.read")
  async exportSealCertificatePdf(@CurrentUser() u: any) {
    return this.service.fetchFinalApexView(
      u.tenantId,
      "export-seal-certificates",
      {},
    );
  }

  @Get("sales-tier-milestones")
  @ApiOperation({ summary: "List sales-tier-milestones" })
  @Permissions("sales.seal.read")
  async listTierMilestones(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchFinalApexView(u.tenantId, "tier-milestones", q);
  }
  @Post("sales-tier-milestones")
  @ApiOperation({ summary: "Create sales-tier-milestones" })
  @Permissions("sales.seal.write")
  async createTierMilestone(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "create-tier-milestone",
      b,
    );
  }
  @Get("sales-tier-milestones/:id")
  @ApiOperation({ summary: "Get tier milestone by ID" })
  @Permissions("sales.seal.read")
  async getTierMilestoneById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.fetchFinalApexView(u.tenantId, "tier-milestones", {
      id,
    });
  }
  @Patch("sales-tier-milestones/:id")
  @ApiOperation({ summary: "Update tier milestone" })
  @Permissions("sales.seal.write")
  async updateTierMilestone(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "update-tier-milestone",
      { id, ...b },
    );
  }
  @Delete("sales-tier-milestones/:id")
  @ApiOperation({ summary: "Delete tier milestone" })
  @Permissions("sales.seal.write")
  async deleteTierMilestone(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "delete-tier-milestone",
      { id },
    );
  }

  @Get("revops-apex-verifications")
  @ApiOperation({ summary: "List revops-apex-verifications" })
  @Permissions("sales.seal.read")
  async listApexVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchFinalApexView(u.tenantId, "apex-verifications", q);
  }
  @Post("revops-apex-verifications")
  @ApiOperation({ summary: "Create revops-apex-verifications" })
  @Permissions("sales.seal.write")
  async createApexVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "create-apex-verification",
      b,
    );
  }
  @Get("revops-apex-verifications/:id")
  @ApiOperation({ summary: "Get apex verification by ID" })
  @Permissions("sales.seal.read")
  async getApexVerificationById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.fetchFinalApexView(u.tenantId, "apex-verifications", {
      id,
    });
  }
  @Patch("revops-apex-verifications/:id")
  @ApiOperation({ summary: "Update apex verification" })
  @Permissions("sales.seal.write")
  async updateApexVerification(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "update-apex-verification",
      { id, ...b },
    );
  }
  @Delete("revops-apex-verifications/:id")
  @ApiOperation({ summary: "Delete apex verification" })
  @Permissions("sales.seal.write")
  async deleteApexVerification(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "delete-apex-verification",
      { id },
    );
  }

  @Get("sales-deep-status-reports")
  @ApiOperation({ summary: "List sales-deep-status-reports" })
  @Permissions("sales.seal.read")
  async listDeepStatusReports(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchFinalApexView(
      u.tenantId,
      "deep-status-reports",
      q,
    );
  }
  @Post("sales-deep-status-reports")
  @ApiOperation({ summary: "Create sales-deep-status-reports" })
  @Permissions("sales.seal.write")
  async createDeepStatusReport(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "create-deep-status-report",
      b,
    );
  }
  @Get("sales-deep-status-reports/:id")
  @ApiOperation({ summary: "Get deep status report by ID" })
  @Permissions("sales.seal.read")
  async getDeepStatusReportById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.fetchFinalApexView(u.tenantId, "deep-status-reports", {
      id,
    });
  }
  @Patch("sales-deep-status-reports/:id")
  @ApiOperation({ summary: "Update deep status report" })
  @Permissions("sales.seal.write")
  async updateDeepStatusReport(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "update-deep-status-report",
      { id, ...b },
    );
  }
  @Delete("sales-deep-status-reports/:id")
  @ApiOperation({ summary: "Delete deep status report" })
  @Permissions("sales.seal.write")
  async deleteDeepStatusReport(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalApexOp(
      u.tenantId,
      "delete-deep-status-report",
      { id },
    );
  }
}
