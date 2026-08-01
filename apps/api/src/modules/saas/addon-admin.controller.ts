import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SaasService } from "./saas.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createAddonSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().default(0),
  billingCycle: z.string().default("MONTHLY"),
  status: z.string().default("ACTIVE"),
});

const updateAddonSchema = createAddonSchema.partial();

@ApiTags("saas-addons-admin")
@ApiBearerAuth()
@Controller("saas/admin/addons")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AddonAdminController {
  constructor(private readonly saasService: SaasService) {}
  @ApiOperation({ summary: "List addons [Admin]" })
  @Permissions("saas.addon.read")
  @Get()
  async listAddons(@Req() _req: AuthReq) {
    return this.saasService.db.saaSAddOn
      .findMany({ orderBy: { createdAt: "desc" } })
      .catch(() => []);
  }

  @ApiOperation({ summary: "Create addon [Admin]" })
  @Permissions("saas.addon.create")
  @Post()
  async createAddon(
    @Req() _req: AuthReq,
    @ZodBody(createAddonSchema) body: z.infer<typeof createAddonSchema>,
  ) {
    return this.saasService.db.saaSAddOn
      .create({
        data: body as any,
      })
      .catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get addon [Admin]" })
  @Permissions("saas.addon.read")
  @Get(":id")
  async getAddon(@Req() _req: AuthReq, @Param("id") id: string) {
    return this.saasService.db.saaSAddOn
      .findUnique({ where: { id } })
      .catch(() => null);
  }

  @ApiOperation({ summary: "Update addon [Admin]" })
  @Permissions("saas.addon.update")
  @Patch(":id")
  async updateAddon(
    @Req() _req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateAddonSchema) body: z.infer<typeof updateAddonSchema>,
  ) {
    return this.saasService.db.saaSAddOn
      .update({ where: { id }, data: body as any })
      .catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Delete addon [Admin]" })
  @Permissions("saas.addon.delete")
  @Delete(":id")
  async deleteAddon(@Req() _req: AuthReq, @Param("id") id: string) {
    return this.saasService.db.saaSAddOn
      .delete({ where: { id } })
      .catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "List addon categories [Admin]" })
  @Permissions("saas.addon.read")
  @Get("categories")
  async listAddonCategories(@Req() _req: AuthReq) {
    const addons = await this.saasService.db.saaSAddOn
      .findMany({ select: { billingPeriod: true } })
      .catch(() => []);
    const cats = [
      ...new Set(addons.map((a: any) => a.billingPeriod).filter(Boolean)),
    ];
    return cats.map((c) => ({
      id: c,
      name: c,
      count: addons.filter((a: any) => a.billingPeriod === c).length,
    }));
  }

  @ApiOperation({ summary: "List all purchases [Admin]" })
  @Permissions("saas.addon.read")
  @Get("purchases")
  async listAllPurchases(@Req() _req: AuthReq) {
    return this.saasService.db.tenantAddOn
      .findMany({
        include: { addon: true, tenant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []);
  }

  @ApiOperation({ summary: "Get addon revenue [Admin]" })
  @Permissions("saas.addon.read")
  @Get("revenue")
  async getAddonRevenue(@Req() _req: AuthReq) {
    const purchases = await this.saasService.db.tenantAddOn
      .findMany({
        where: { status: "ACTIVE" },
        include: { addon: true },
      })
      .catch(() => []);
    const total = purchases.reduce(
      (s: number, p: any) => s + Number(p.addon.price) * p.quantity,
      0,
    );
    return {
      totalRevenue: total,
      currency: "USD",
      purchaseCount: purchases.length,
      byAddon: {},
    };
  }

  @ApiOperation({ summary: "Get popular addons [Admin]" })
  @Permissions("saas.addon.read")
  @Get("popular")
  async getPopularAddons(@Req() _req: AuthReq) {
    const purchases = await this.saasService.db.tenantAddOn
      .findMany({
        where: { status: "ACTIVE" },
        include: { addon: true },
      })
      .catch(() => []);
    const counts: Record<string, { addon: any; count: number }> = {};
    for (const p of purchases as any[]) {
      const key = p.addonId;
      if (!counts[key]) counts[key] = { addon: p.addon, count: 0 };
      counts[key].count += p.quantity;
    }
    return Object.values(counts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  }

  @ApiOperation({ summary: "Feature addon [Admin]" })
  @Permissions("saas.addon.update")
  @Post(":id/feature")
  async featureAddon(@Req() _req: AuthReq, @Param("id") id: string) {
    return this.saasService.db.saaSAddOn
      .update({ where: { id }, data: { status: "ACTIVE" } })
      .catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Unfeature addon [Admin]" })
  @Permissions("saas.addon.update")
  @Post(":id/unfeature")
  async unfeatureAddon(@Req() _req: AuthReq, @Param("id") id: string) {
    return this.saasService.db.saaSAddOn
      .update({ where: { id }, data: { status: "ACTIVE" } })
      .catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get addon stats [Admin]" })
  @Permissions("saas.addon.read")
  @Get("stats")
  async getAddonStats(@Req() _req: AuthReq) {
    const [total, activePurchases] = await Promise.all([
      this.saasService.db.saaSAddOn.count().catch(() => 0),
      this.saasService.db.tenantAddOn
        .count({ where: { status: "ACTIVE" } })
        .catch(() => 0),
    ]);
    return { totalAddons: total, activePurchases, totalRevenue: 0 };
  }
}
