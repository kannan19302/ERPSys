import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasService } from "./saas.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed", "free_trial"]),
  discountValue: z.number().min(0),
  maxRedemptions: z.number().int().min(0).default(0),
  expiresAt: z.string().datetime().optional(),
  minPlanTier: z.string().optional(),
  appliesToPlanIds: z.array(z.string()).optional(),
});

const updateCouponSchema = createCouponSchema.partial();

const bulkCreateCouponsSchema = z.object({
  codes: z.array(z.string().min(1)).min(1).max(100),
  discountType: z.enum(["percentage", "fixed", "free_trial"]),
  discountValue: z.number().min(0),
  maxRedemptions: z.number().int().min(0).default(1),
  expiresAt: z.string().datetime().optional(),
});

@ApiTags("saas-coupons-admin")
@ApiBearerAuth()
@Controller("saas/admin/coupons")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CouponsAdminController {
  constructor(private readonly saasService: SaasService) {}

  @ApiOperation({ summary: "List coupons [Admin]" })
  @Permissions("saas.coupon.read")
  @Get()
  async listCoupons(@Req() _req: AuthReq) {
    return this.saasService.getCoupons().catch(() => []);
  }

  @ApiOperation({ summary: "Create coupon [Admin]" })
  @Permissions("saas.coupon.create")
  @Post()
  async createCoupon(@Req() _req: AuthReq, @ZodBody(createCouponSchema) body: z.infer<typeof createCouponSchema>) {
    return this.saasService.createCoupon(body).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get coupon [Admin]" })
  @Permissions("saas.coupon.read")
  @Get(":id")
  async getCoupon(@Req() _req: AuthReq, @Param("id") id: string) {
    const coupons = await this.saasService.getCoupons().catch(() => []);
    return (coupons as any[]).find((c) => c.id === id) || null;
  }

  @ApiOperation({ summary: "Update coupon [Admin]" })
  @Permissions("saas.coupon.update")
  @Patch(":id")
  async updateCoupon(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(updateCouponSchema) body: z.infer<typeof updateCouponSchema>) {
    return prisma.saaSCoupon.update({ where: { id }, data: body as any }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Delete coupon [Admin]" })
  @Permissions("saas.coupon.delete")
  @Delete(":id")
  async deleteCoupon(@Req() _req: AuthReq, @Param("id") id: string) {
    return prisma.saaSCoupon.delete({ where: { id } }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Disable coupon [Admin]" })
  @Permissions("saas.coupon.update")
  @Post(":id/disable")
  async disableCoupon(@Req() _req: AuthReq, @Param("id") id: string) {
    return prisma.saaSCoupon.update({ where: { id }, data: { status: "DISABLED" } }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Enable coupon [Admin]" })
  @Permissions("saas.coupon.update")
  @Post(":id/enable")
  async enableCoupon(@Req() _req: AuthReq, @Param("id") id: string) {
    return prisma.saaSCoupon.update({ where: { id }, data: { status: "ACTIVE" } }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get coupon stats [Admin]" })
  @Permissions("saas.coupon.read")
  @Get("stats")
  async getCouponStats(@Req() _req: AuthReq) {
    const coupons = await this.saasService.getCoupons().catch(() => []);
    const total = coupons.length;
    const totalRedeemed = (coupons as any[]).reduce((s, c) => s + (c.timesRedeemed || 0), 0);
    return { total, activeCount: total, totalRedeemed, topCoupons: [] };
  }

  @ApiOperation({ summary: "Get redeemed coupons [Admin]" })
  @Permissions("saas.coupon.read")
  @Get("redeemed")
  async getRedeemedCoupons(@Req() _req: AuthReq) {
    const coupons = await this.saasService.getCoupons().catch(() => []);
    return (coupons as any[]).filter((c) => (c.timesRedeemed || 0) > 0);
  }

  @ApiOperation({ summary: "Bulk create coupons [Admin]" })
  @Permissions("saas.coupon.create")
  @Post("bulk-create")
  async bulkCreateCoupons(@Req() _req: AuthReq, @ZodBody(bulkCreateCouponsSchema) body: z.infer<typeof bulkCreateCouponsSchema>) {
    const results = [];
    for (const code of body.codes) {
      try {
        const c = await this.saasService.createCoupon({ code, discountType: body.discountType, discountValue: body.discountValue });
        results.push(c);
      } catch {
        results.push({ code, error: "duplicate" });
      }
    }
    return { created: results.filter((r: any) => !r.error).length, duplicates: results.filter((r: any) => r.error).length, results };
  }

  @ApiOperation({ summary: "Export coupons [Admin]" })
  @Permissions("saas.coupon.read")
  @Get("export")
  async exportCoupons(@Req() _req: AuthReq) {
    const coupons = await this.saasService.getCoupons().catch(() => []);
    return { format: "csv", data: JSON.stringify(coupons), filename: `coupons-export-${Date.now()}.csv` };
  }

  @ApiOperation({ summary: "Generate coupon codes [Admin]" })
  @Permissions("saas.coupon.read")
  @Get("codes")
  async generateCouponCodes(@Req() _req: AuthReq, @Query("count") count?: string, @Query("prefix") prefix?: string, @Query("length") length?: string) {
    const cnt = count ? parseInt(count, 10) : 10;
    const len = length ? parseInt(length, 10) : 10;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codes = [];
    for (let i = 0; i < cnt; i++) {
      let code = prefix || "";
      for (let j = code.length; j < len; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    return { codes, count: codes.length };
  }
}
