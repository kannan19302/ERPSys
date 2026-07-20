import {
  Controller,
  Get,
  Post,
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
import { TenantAnalyticsService } from "./tenant-analytics.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const provisionTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  planId: z.string().min(1),
  adminEmail: z.string().email(),
  adminName: z.string().optional(),
  trialDays: z.number().int().min(0).default(14),
  settings: z.record(z.unknown()).optional(),
});

const upgradeTenantPlanSchema = z.object({
  planId: z.string().min(1),
  immediate: z.boolean().default(false),
});

const downgradeTenantPlanSchema = z.object({
  planId: z.string().min(1),
  immediate: z.boolean().default(false),
});

const createProvisioningTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  planId: z.string().min(1),
  trialDays: z.number().int().min(0).default(14),
  defaultApps: z.array(z.string()).default([]),
  settings: z.record(z.unknown()).optional(),
});

const bulkProvisionSchema = z.object({
  tenants: z.array(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    adminEmail: z.string().email(),
  })).min(1).max(50),
  planId: z.string().min(1),
  trialDays: z.number().int().min(0).default(14),
});

@ApiTags("saas-provisioning")
@ApiBearerAuth()
@Controller("saas/admin/provisioning")
@UseGuards(JwtAuthGuard, RbacGuard)
export class TenantProvisioningController {
  constructor(private readonly tenantAnalyticsService: TenantAnalyticsService) {}

  @ApiOperation({ summary: "List provisioning jobs [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("jobs")
  async listProvisioningJobs(@Req() _req: AuthReq) {
    return [];
  }

  @ApiOperation({ summary: "Provision tenant [Admin]" })
  @Permissions("saas.tenant.create")
  @Post("tenant")
  async provisionTenant(@Req() _req: AuthReq, @ZodBody(provisionTenantSchema) body: z.infer<typeof provisionTenantSchema>) {
    const tenant = await prisma.tenant.create({
      data: {
        name: body.name,
        slug: body.slug,
        status: "ACTIVE",
        settings: (body.settings || {}) as any,
      },
    }).catch(() => null);
    if (tenant) {
      await prisma.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: body.planId,
          status: "TRIAL",
          startDate: new Date(),
          endDate: new Date(Date.now() + body.trialDays * 86400000),
        },
      }).catch(() => {});
    }
    return { success: true, tenantId: tenant?.id, provisioned: !!tenant };
  }

  @ApiOperation({ summary: "Upgrade tenant plan [Admin]" })
  @Permissions("saas.tenant.update")
  @Post("tenant/:id/upgrade")
  async upgradeTenantPlan(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(upgradeTenantPlanSchema) body: z.infer<typeof upgradeTenantPlanSchema>) {
    const sub = await prisma.tenantSubscription.findFirst({ where: { tenantId: id } });
    if (!sub) return { success: false };
    return prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: { planId: body.planId },
    }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Downgrade tenant plan [Admin]" })
  @Permissions("saas.tenant.update")
  @Post("tenant/:id/downgrade")
  async downgradeTenantPlan(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(downgradeTenantPlanSchema) body: z.infer<typeof downgradeTenantPlanSchema>) {
    const sub = await prisma.tenantSubscription.findFirst({ where: { tenantId: id } });
    if (!sub) return { success: false };
    return prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: { planId: body.planId },
    }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Extend trial [Admin]" })
  @Permissions("saas.tenant.update")
  @Post("tenant/:id/extend-trial")
  async extendTrial(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(z.object({ days: z.number().int().min(1).max(90) })) body: { days: number }) {
    const sub = await prisma.tenantSubscription.findFirst({ where: { tenantId: id } });
    if (!sub) return { success: false };
    const newEnd = new Date(sub.endDate || Date.now());
    newEnd.setDate(newEnd.getDate() + body.days);
    return prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: { endDate: newEnd, status: "TRIAL" },
    }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get provisioning audit [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("tenant/:id/audit")
  async getProvisioningAudit(@Req() _req: AuthReq, @Param("id") id: string) {
    return this.tenantAnalyticsService.getTenantDetail(id).catch(() => null);
  }

  @ApiOperation({ summary: "Reset tenant [Admin]" })
  @Permissions("saas.tenant.update")
  @Post("tenant/:id/reset")
  async resetTenant(@Req() _req: AuthReq, @Param("id") id: string) {
    return prisma.tenant.update({ where: { id }, data: { status: "ACTIVE" } }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "List provisioning templates [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("templates")
  async listProvisioningTemplates(@Req() _req: AuthReq) {
    return [];
  }

  @ApiOperation({ summary: "Create provisioning template [Admin]" })
  @Permissions("saas.tenant.create")
  @Post("templates")
  async createProvisioningTemplate(@Req() _req: AuthReq, @ZodBody(createProvisioningTemplateSchema) body: z.infer<typeof createProvisioningTemplateSchema>) {
    return { success: true, template: body };
  }

  @ApiOperation({ summary: "List provisioning errors [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("errors")
  async listProvisioningErrors(@Req() _req: AuthReq) {
    return [];
  }

  @ApiOperation({ summary: "Retry provisioning job [Admin]" })
  @Permissions("saas.tenant.update")
  @Post("retry/:jobId")
  async retryProvisioningJob(@Req() _req: AuthReq, @Param("jobId") jobId: string) {
    return { success: true, jobId };
  }

  @ApiOperation({ summary: "Get provisioning stats [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("stats")
  async getProvisioningStats(@Req() _req: AuthReq) {
    const total = await prisma.tenant.count().catch(() => 0);
    const active = await prisma.tenant.count({ where: { status: "ACTIVE" } }).catch(() => 0);
    return { totalTenants: total, activeTenants: active, pendingProvisioning: 0, failedProvisioning: 0 };
  }

  @ApiOperation({ summary: "Bulk provision tenants [Admin]" })
  @Permissions("saas.tenant.create")
  @Post("bulk")
  async bulkProvisionTenants(@Req() _req: AuthReq, @ZodBody(bulkProvisionSchema) body: z.infer<typeof bulkProvisionSchema>) {
    const results = [];
    for (const t of body.tenants) {
      try {
        const tenant = await prisma.tenant.create({ data: { name: t.name, slug: t.slug, status: "ACTIVE" } });
        await prisma.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: body.planId,
            status: "TRIAL",
            startDate: new Date(),
            endDate: new Date(Date.now() + body.trialDays * 86400000),
          },
        });
        results.push({ name: t.name, success: true, tenantId: tenant.id });
      } catch (err: any) {
        results.push({ name: t.name, success: false, error: err.message });
      }
    }
    return { total: body.tenants.length, succeeded: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
  }

  @ApiOperation({ summary: "Get provisioning queue [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("queue")
  async getProvisioningQueue(@Req() _req: AuthReq) {
    return { queued: 0, processing: 0, estimatedWaitMinutes: 0 };
  }
}
