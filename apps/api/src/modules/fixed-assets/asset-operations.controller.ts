import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AssetOperationsService } from "./asset-operations.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
  };
}

@Controller("fixed-assets")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AssetOperationsController {
  constructor(private readonly service: AssetOperationsService) {}

  @Get("insurance")
  @Permissions("fixed-assets.insurance.read")
  async getInsurancePolicies(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.service.getInsurancePolicies(req.user.tenantId, query);
  }

  @Post("insurance")
  @Permissions("fixed-assets.insurance.create")
  async createInsurancePolicy(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.service.createInsurancePolicy(req.user.tenantId, body);
  }

  @Get("revaluation")
  @Permissions("fixed-assets.revaluation.read")
  async getAssetRevaluations(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.service.getAssetRevaluations(req.user.tenantId, query);
  }

  @Post("revaluation")
  @Permissions("fixed-assets.revaluation.create")
  async createAssetRevaluation(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.service.createAssetRevaluation(req.user.tenantId, body);
  }

  @Get("physical-audit")
  @Permissions("fixed-assets.physical-audit.read")
  async getPhysicalAudits(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.service.getPhysicalAudits(req.user.tenantId, query);
  }

  @Post("physical-audit")
  @Permissions("fixed-assets.physical-audit.create")
  async createPhysicalAudit(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.service.createPhysicalAudit(req.user.tenantId, body);
  }
}
