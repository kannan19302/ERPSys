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
import { CrmAbmOrchestrationService } from "./crm-abm-orchestration.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / abm-orchestration")
@ApiBearerAuth()
@Controller("crm/abm-orchestration")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmAbmOrchestrationController {
  constructor(private readonly svc: CrmAbmOrchestrationService) {}

  @Post("account-lists")
  @Permissions("crm.abm.list.create")
  @ApiOperation({ summary: "Create ABM account target list" })
  async createAccountList(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      tier?: "TIER_1" | "TIER_2" | "TIER_3";
      targetIndustry?: string;
      minRevenue?: number;
      maxRevenue?: number;
    },
  ) {
    return {
      data: await this.svc.createAccountList(req.user.tenantId, {
        ...body,
        tier: body.tier ?? "TIER_1",
      }),
    };
  }

  @Get("account-lists")
  @Permissions("crm.abm.list.read")
  @ApiOperation({ summary: "Get ABM account target lists" })
  async getAccountLists(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAccountLists(req.user.tenantId) };
  }

  @Post("account-lists/:listId/add-accounts")
  @Permissions("crm.abm.list.update")
  @ApiOperation({ summary: "Add target accounts to ABM list" })
  async addAccountsToList(
    @Req() req: AuthenticatedRequest,
    @Param("listId") listId: string,
    @Body() body: { customerIds: string[] },
  ) {
    return {
      data: await this.svc.addAccountsToList(
        req.user.tenantId,
        listId,
        body.customerIds,
      ),
    };
  }

  @Get("buying-committee/:customerId")
  @Permissions("crm.abm.committee.read")
  @ApiOperation({ summary: "Get account buying committee map" })
  async getBuyingCommittee(
    @Req() req: AuthenticatedRequest,
    @Param("customerId") customerId: string,
  ) {
    return {
      data: await this.svc.getBuyingCommittee(req.user.tenantId, customerId),
    };
  }

  @Post("playbooks")
  @Permissions("crm.abm.playbook.create")
  @ApiOperation({ summary: "Create ABM execution playbook" })
  async createPlaybook(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      targetTier?: string;
      triggerCondition: string;
      stepsJson?: string;
    },
  ) {
    return {
      data: await this.svc.createPlaybook(req.user.tenantId, {
        ...body,
        targetTier: body.targetTier ?? "TIER_1",
        stepsJson: body.stepsJson ?? "[]",
      }),
    };
  }

  @Get("playbooks")
  @Permissions("crm.abm.playbook.read")
  @ApiOperation({ summary: "Get ABM execution playbooks" })
  async getPlaybooks(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPlaybooks(req.user.tenantId) };
  }

  @Get("coverage-matrix")
  @Permissions("crm.abm.coverage.read")
  @ApiOperation({ summary: "Get ABM target account coverage matrix" })
  async getAbmCoverageMatrix(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAbmCoverageMatrix(req.user.tenantId) };
  }

  @Post("trigger-sequence")
  @Permissions("crm.abm.sequence.trigger")
  @ApiOperation({ summary: "Trigger ABM campaign sequence" })
  async triggerAbmSequence(
    @Req() req: AuthenticatedRequest,
    @Body() body: { listId: string; playbookId: string },
  ) {
    return {
      data: await this.svc.triggerAbmSequence(
        req.user.tenantId,
        body.listId,
        body.playbookId,
      ),
    };
  }

  @Get("roi-analytics")
  @Permissions("crm.abm.roi.read")
  @ApiOperation({ summary: "Get ABM ROI analytics and revenue attribution" })
  async getAbmRoiAnalytics(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAbmRoiAnalytics(req.user.tenantId) };
  }
}
