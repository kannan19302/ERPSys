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
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SalesPartnersService } from "./sales-partners.service";
import {
  createPartnerSchema,
  updatePartnerSchema,
  createPartnerTierSchema,
  updatePartnerTierSchema,
  CreatePartnerDto,
  UpdatePartnerDto,
  CreatePartnerTierDto,
  UpdatePartnerTierDto,
} from "./dto/sales-extra.dto";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-partners")
@ApiBearerAuth()
@Controller("sales/partners")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesPartnersController {
  constructor(private readonly partnersService: SalesPartnersService) {}

  @Get()
  @Permissions("sales.partner.read")
  @ApiOperation({ summary: "List partners" })
  async getPartners(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.partnersService.getPartners(req.user.tenantId, status);
  }

  @Get("dashboard")
  @Permissions("sales.partner.read")
  @ApiOperation({ summary: "Partner dashboard statistics" })
  async getPartnerDashboard(@Req() req: AuthenticatedRequest) {
    return this.partnersService.getPartnerDashboard(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("sales.partner.read")
  @ApiOperation({ summary: "Get partner by id" })
  async getPartnerById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.partnersService.getPartnerById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("sales.partner.create")
  @ApiOperation({ summary: "Create a partner" })
  async createPartner(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPartnerSchema) dto: CreatePartnerDto,
  ) {
    const orgId = req.user.orgId || "org-system-default";
    return this.partnersService.createPartner(
      req.user.tenantId,
      orgId,
      dto,
      req.user.userId || "system",
    );
  }

  @Patch(":id")
  @Permissions("sales.partner.update")
  @ApiOperation({ summary: "Update a partner" })
  async updatePartner(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updatePartnerSchema) dto: UpdatePartnerDto,
  ) {
    return this.partnersService.updatePartner(req.user.tenantId, id, dto);
  }

  @Delete(":id")
  @Permissions("sales.partner.delete")
  @ApiOperation({ summary: "Soft delete a partner" })
  async deletePartner(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.partnersService.deletePartner(req.user.tenantId, id);
  }

  @Get("tiers")
  @Permissions("sales.partner-tier.read")
  @ApiOperation({ summary: "List partner tiers" })
  async getTiers(@Req() req: AuthenticatedRequest) {
    return this.partnersService.getTiers(req.user.tenantId);
  }

  @Post("tiers")
  @Permissions("sales.partner-tier.create")
  @ApiOperation({ summary: "Create a partner tier" })
  async createTier(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPartnerTierSchema) dto: CreatePartnerTierDto,
  ) {
    const orgId = req.user.orgId || "org-system-default";
    return this.partnersService.createTier(req.user.tenantId, orgId, dto);
  }

  @Patch("tiers/:id")
  @Permissions("sales.partner-tier.update")
  @ApiOperation({ summary: "Update a partner tier" })
  async updateTier(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updatePartnerTierSchema) dto: UpdatePartnerTierDto,
  ) {
    return this.partnersService.updateTier(req.user.tenantId, id, dto);
  }

  @Delete("tiers/:id")
  @Permissions("sales.partner-tier.delete")
  @ApiOperation({ summary: "Delete a partner tier" })
  async deleteTier(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.partnersService.deleteTier(req.user.tenantId, id);
  }
}
