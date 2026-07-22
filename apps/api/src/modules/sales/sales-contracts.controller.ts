import {
  Controller,
  Get,
  Post,
  Patch,
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
import { SalesContractsService } from "./sales-contracts.service";
import {
  createSalesContractSchema,
  CreateSalesContractDto,
  updateSalesContractStatusSchema,
  UpdateSalesContractStatusDto,
} from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-contracts")
@ApiBearerAuth()
@Controller("sales/contracts")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesContractsController {
  constructor(private readonly salesContractsService: SalesContractsService) {}

  @Get()
  @Permissions("sales.contract.read")
  @ApiOperation({ summary: "List sales contracts" })
  async getContracts(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.salesContractsService.getContracts(req.user.tenantId, status);
  }

  @Get("dashboard")
  @Permissions("sales.contract.read")
  @ApiOperation({ summary: "Sales contract dashboard stats" })
  async getContractDashboard(@Req() req: AuthenticatedRequest) {
    return this.salesContractsService.getContractDashboard(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("sales.contract.read")
  @ApiOperation({ summary: "Get a sales contract by id" })
  async getContractById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.salesContractsService.getContractById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("sales.contract.create")
  @ApiOperation({ summary: "Create a sales contract" })
  async createContract(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createSalesContractSchema) dto: CreateSalesContractDto,
  ) {
    const orgId = req.user.orgId || "org-system-default";
    return this.salesContractsService.createContract(
      req.user.tenantId,
      orgId,
      dto,
      req.user.userId || "system",
    );
  }

  @Patch(":id")
  @Permissions("sales.contract.update")
  @ApiOperation({ summary: "Update a sales contract" })
  async updateContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.salesContractsService.updateContract(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Patch(":id/status")
  @Permissions("sales.contract.update")
  @ApiOperation({ summary: "Update sales contract status" })
  async updateContractStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateSalesContractStatusSchema) dto: UpdateSalesContractStatusDto,
  ) {
    return this.salesContractsService.updateContractStatus(
      req.user.tenantId,
      id,
      dto.status,
      req.user.userId || "system",
    );
  }

  @Post(":id/renew")
  @Permissions("sales.contract.renew")
  @ApiOperation({ summary: "Renew a sales contract" })
  async renewContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.salesContractsService.renewContract(
      req.user.tenantId,
      id,
      req.user.userId || "system",
    );
  }

  @Delete(":id")
  @Permissions("sales.contract.delete")
  @ApiOperation({ summary: "Soft delete a sales contract" })
  async deleteContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.salesContractsService.deleteContract(req.user.tenantId, id);
  }

  @Get(":id/milestones")
  @Permissions("sales.contract.read")
  @ApiOperation({ summary: "List billing milestones for a contract" })
  async getMilestones(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.salesContractsService.getMilestones(req.user.tenantId, id);
  }

  @Patch("milestones/:id/status")
  @Permissions("sales.contract.update")
  @ApiOperation({ summary: "Update billing milestone status" })
  async updateMilestoneStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: { status: string },
  ) {
    return this.salesContractsService.updateMilestoneStatus(
      req.user.tenantId,
      id,
      dto.status,
    );
  }
}
