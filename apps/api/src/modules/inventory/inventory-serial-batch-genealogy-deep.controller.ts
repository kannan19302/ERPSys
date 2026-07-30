// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InventorySerialBatchGenealogyDeepService } from "./inventory-serial-batch-genealogy-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("inventory / serial-batch-genealogy-deep")
@ApiBearerAuth()
@Controller("inventory/serial-batch-genealogy-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventorySerialBatchGenealogyDeepController {
  constructor(private readonly svc: InventorySerialBatchGenealogyDeepService) {}

  @Post("quarantine-batch")
  @Permissions("inventory.batch.quarantine.create")
  @ApiOperation({
    summary: "Quarantine inventory batch lot due to quality non-conformance",
  })
  async quarantineBatch(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: { batchNumber: string; reason: string; quarantineZoneId: string },
  ) {
    return { data: await this.svc.quarantineBatch(req.user.tenantId, body) };
  }

  @Get("genealogy-tree/:batchNumber")
  @Permissions("inventory.batch.genealogy.read")
  @ApiOperation({
    summary: "Get bi-directional serial & batch lot genealogy tree",
  })
  async getBatchGenealogyTree(
    @Req() req: AuthenticatedRequest,
    @Param("batchNumber") batchNumber: string,
  ) {
    return {
      data: await this.svc.getBatchGenealogyTree(
        req.user.tenantId,
        batchNumber,
      ),
    };
  }

  @Post("recall-campaign")
  @Permissions("inventory.batch.recall.create")
  @ApiOperation({ summary: "Trigger emergency batch product recall campaign" })
  async triggerBatchRecallCampaign(
    @Req() req: AuthenticatedRequest,
    @Body() body: { batchNumber: string; recallReason: string },
  ) {
    return {
      data: await this.svc.triggerBatchRecallCampaign(
        req.user.tenantId,
        body.batchNumber,
        body.recallReason,
      ),
    };
  }
}
