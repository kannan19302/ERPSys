// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsClaimsService } from "../services/projects-claims.service";
import {
  CreateClaimSchema,
  SubmitVariationOrderSchema,
  EvaluateClaimSchema,
  DisputeSchema,
  ClaimDocSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-claims")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ClaimsController {
  constructor(private readonly service: ProjectsClaimsService) {}

  @Get("claims")
  @Permissions("projects.claim.read")
  async getClaims(
    @Req() req: AuthenticatedRequest,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.getClaims(req.user.tenantId, projectId);
  }

  @Get("claims/:id")
  @Permissions("projects.claim.read")
  async getClaimById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getClaimById(req.user.tenantId, id);
  }

  @Post("claims")
  @Permissions("projects.claim.create")
  async createClaim(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateClaimSchema) dto: unknown,
  ) {
    return this.service.createClaim(req.user.tenantId, dto as any);
  }

  @Put("claims/:claimId/evaluate")
  @Permissions("projects.claim.update")
  async evaluateClaim(
    @Req() req: AuthenticatedRequest,
    @Param("claimId") claimId: string,
    @ZodBody(EvaluateClaimSchema) dto: unknown,
  ) {
    return this.service.evaluateClaim(req.user.tenantId, claimId, dto as any);
  }

  @Post("variation-orders")
  @Permissions("projects.variation-order.create")
  async submitVariationOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(SubmitVariationOrderSchema) dto: unknown,
  ) {
    return this.service.submitVariationOrder(req.user.tenantId, dto as any);
  }

  @Get("variation-orders")
  @Permissions("projects.variation-order.read")
  async getVariationOrders(
    @Req() req: AuthenticatedRequest,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.getVariationOrders(req.user.tenantId, projectId);
  }

  @Post("claims/:claimId/disputes")
  @Permissions("projects.claim.update")
  async resolveDispute(
    @Req() req: AuthenticatedRequest,
    @Param("claimId") claimId: string,
    @ZodBody(DisputeSchema) dto: unknown,
  ) {
    return this.service.resolveDispute(req.user.tenantId, claimId, dto as any);
  }

  @Post("claims/:claimId/documents")
  @Permissions("projects.claim.create")
  async addClaimDocument(
    @Req() req: AuthenticatedRequest,
    @Param("claimId") claimId: string,
    @ZodBody(ClaimDocSchema) dto: unknown,
  ) {
    return this.service.addClaimDocument(
      req.user.tenantId,
      claimId,
      dto as any,
    );
  }

  @Get("claims-dashboard")
  @Permissions("projects.claim.read")
  async getClaimsDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getClaimsDashboard(req.user.tenantId);
  }
}
