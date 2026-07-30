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
import { CrmAccountHierarchiesDeepService } from "./crm-account-hierarchies-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / account-hierarchies-deep")
@ApiBearerAuth()
@Controller("crm/account-hierarchies-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmAccountHierarchiesDeepController {
  constructor(private readonly svc: CrmAccountHierarchiesDeepService) {}

  @Post("link")
  @Permissions("crm.hierarchy.link.create")
  @ApiOperation({ summary: "Link parent-child enterprise account hierarchy" })
  async linkAccountHierarchy(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      parentAccountId: string;
      childAccountId: string;
      relationshipType?: "SUBSIDIARY" | "DIVISION" | "BRANCH" | "AFFILIATE";
      ownershipPercentage?: number;
    },
  ) {
    return {
      data: await this.svc.linkAccountHierarchy(req.user.tenantId, {
        ...body,
        relationshipType: body.relationshipType ?? "SUBSIDIARY",
      }),
    };
  }

  @Get("tree/:rootAccountId")
  @Permissions("crm.hierarchy.tree.read")
  @ApiOperation({
    summary: "Get global account hierarchy tree and aggregate ARR",
  })
  async getAccountTree(
    @Req() req: AuthenticatedRequest,
    @Param("rootAccountId") rootAccountId: string,
  ) {
    return {
      data: await this.svc.getAccountTree(req.user.tenantId, rootAccountId),
    };
  }

  @Get("credit-pool/:globalParentId")
  @Permissions("crm.hierarchy.credit.read")
  @ApiOperation({
    summary: "Get global credit pool limit and subsidiary drawdowns",
  })
  async getGlobalCreditPool(
    @Req() req: AuthenticatedRequest,
    @Param("globalParentId") globalParentId: string,
  ) {
    return {
      data: await this.svc.getGlobalCreditPool(
        req.user.tenantId,
        globalParentId,
      ),
    };
  }

  @Get("cross-subsidiary-deals/:globalParentId")
  @Permissions("crm.hierarchy.deals.read")
  @ApiOperation({
    summary: "Get cross-subsidiary opportunity deals across account tree",
  })
  async getCrossSubsidiaryDeals(
    @Req() req: AuthenticatedRequest,
    @Param("globalParentId") globalParentId: string,
  ) {
    return {
      data: await this.svc.getCrossSubsidiaryDeals(
        req.user.tenantId,
        globalParentId,
      ),
    };
  }
}
