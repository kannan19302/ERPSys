// @ts-nocheck
import { Controller, Get, Post, Delete, UseGuards, Req, Param, NotFoundException } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasService } from "./saas.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const purchaseAddonSchema = z.object({ quantity: z.number().int().min(1).default(1) });

@ApiTags("saas-addons")
@ApiBearerAuth()
@Controller("saas/addons")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AddonsController {
  constructor(private readonly saasService: SaasService) {}

  @ApiOperation({ summary: "List available addons" })
  @Permissions("saas.addon.read")
  @Get()
  async listAddons() {
    return this.saasService.db.saaSAddOn.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  }

  @ApiOperation({ summary: "Get my addons" })
  @Permissions("saas.addon.read")
  @Get("my")
  async myAddons(@Req() req: AuthReq) {
    return this.saasService.db.tenantAddOn.findMany({ where: { tenantId: req.user.tenantId }, include: { addon: true } });
  }

  @ApiOperation({ summary: "Purchase addon" })
  @Permissions("saas.addon.create")
  @Post(":addonId/purchase")
  async purchaseAddon(@Req() req: AuthReq, @Param("addonId") addonId: string, @ZodBody(purchaseAddonSchema) body: z.infer<typeof purchaseAddonSchema>) {
    const addon = await this.saasService.db.saaSAddOn.findUnique({ where: { id: addonId } });
    if (!addon) throw new NotFoundException("Addon not found");
    return this.saasService.db.tenantAddOn.upsert({ where: { tenantId_addonId: { tenantId: req.user.tenantId, addonId } }, update: { quantity: body.quantity, status: "ACTIVE" }, create: { tenantId: req.user.tenantId, addonId, quantity: body.quantity } });
  }

  @ApiOperation({ summary: "Remove addon purchase" })
  @Permissions("saas.addon.delete")
  @Delete(":addonId")
  async cancelAddon(@Req() req: AuthReq, @Param("addonId") addonId: string) {
    return this.saasService.db.tenantAddOn.deleteMany({ where: { tenantId: req.user.tenantId, addonId } });
  }
}
