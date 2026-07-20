import {
  Controller,
  Get,
  Put,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
});

const updateCompanySchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const updateIndustrySchema = z.object({
  industry: z.string().min(1).max(255).optional(),
  subIndustry: z.string().optional(),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  description: z.string().optional(),
});

const updateTimezoneSchema = z.object({
  timezone: z.string().min(1).max(100).optional(),
});

const updateLocaleSchema = z.object({
  locale: z.string().min(2).max(10).optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  firstDayOfWeek: z.number().int().min(0).max(6).optional(),
});

const updateRetentionSchema = z.object({
  retentionDays: z.number().int().min(30).max(3650).optional(),
  autoDelete: z.boolean().optional(),
  excludedTables: z.array(z.string()).optional(),
});

@ApiTags("saas-profile")
@ApiBearerAuth()
@Controller("saas/profile")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProfileController {

  @ApiOperation({ summary: "Get tenant profile" })
  @Permissions("saas.portal.read")
  @Get()
  async getTenantProfile(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
    });
    return tenant;
  }

  @ApiOperation({ summary: "Update tenant profile" })
  @Permissions("saas.portal.create")
  @Put()
  async updateTenantProfile(@Req() req: AuthReq, @ZodBody(updateProfileSchema) body: z.infer<typeof updateProfileSchema>) {
    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.slug) data.slug = body.slug;
    if (body.settings) {
      const existing = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { settings: true } });
      data.settings = { ...(existing?.settings as Record<string, unknown> ?? {}), ...body.settings };
    }
    return prisma.tenant.update({ where: { id: req.user.tenantId }, data: data as any });
  }

  @ApiOperation({ summary: "Get company details" })
  @Permissions("saas.portal.read")
  @Get("company")
  async getCompanyDetails(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { name: true, settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return {
      companyName: settings.companyName ?? tenant?.name ?? "",
      taxId: settings.taxId ?? "",
      registrationNumber: settings.registrationNumber ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      website: settings.website ?? "",
      address: settings.address ?? "",
      city: settings.city ?? "",
      state: settings.state ?? "",
      postalCode: settings.postalCode ?? "",
      country: settings.country ?? "",
    };
  }

  @ApiOperation({ summary: "Update company details" })
  @Permissions("saas.portal.create")
  @Put("company")
  async updateCompanyDetails(@Req() req: AuthReq, @ZodBody(updateCompanySchema) body: z.infer<typeof updateCompanySchema>) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const updated = { ...settings, ...body };
    return prisma.tenant.update({ where: { id: req.user.tenantId }, data: { settings: updated as any } });
  }

  @ApiOperation({ summary: "Get industry information" })
  @Permissions("saas.portal.read")
  @Get("industry")
  async getIndustryInfo(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return {
      industry: settings.industry ?? "",
      subIndustry: settings.subIndustry ?? "",
      companySize: settings.companySize ?? "",
      description: settings.industryDescription ?? "",
    };
  }

  @ApiOperation({ summary: "Update industry information" })
  @Permissions("saas.portal.create")
  @Put("industry")
  async updateIndustryInfo(@Req() req: AuthReq, @ZodBody(updateIndustrySchema) body: z.infer<typeof updateIndustrySchema>) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return prisma.tenant.update({ where: { id: req.user.tenantId }, data: { settings: { ...settings, ...body } as any } });
  }

  @ApiOperation({ summary: "Get timezone settings" })
  @Permissions("saas.portal.read")
  @Get("timezone")
  async getTimezoneSettings(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return { timezone: settings.timezone ?? "UTC" };
  }

  @ApiOperation({ summary: "Update timezone settings" })
  @Permissions("saas.portal.create")
  @Put("timezone")
  async updateTimezoneSettings(@Req() req: AuthReq, @ZodBody(updateTimezoneSchema) body: z.infer<typeof updateTimezoneSchema>) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return prisma.tenant.update({ where: { id: req.user.tenantId }, data: { settings: { ...settings, timezone: body.timezone } as any } });
  }

  @ApiOperation({ summary: "Get locale settings" })
  @Permissions("saas.portal.read")
  @Get("locale")
  async getLocaleSettings(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return {
      locale: settings.locale ?? "en-US",
      dateFormat: settings.dateFormat ?? "MM/DD/YYYY",
      timeFormat: settings.timeFormat ?? "12h",
      firstDayOfWeek: settings.firstDayOfWeek ?? 0,
    };
  }

  @ApiOperation({ summary: "Update locale settings" })
  @Permissions("saas.portal.create")
  @Put("locale")
  async updateLocaleSettings(@Req() req: AuthReq, @ZodBody(updateLocaleSchema) body: z.infer<typeof updateLocaleSchema>) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return prisma.tenant.update({ where: { id: req.user.tenantId }, data: { settings: { ...settings, ...body } as any } });
  }

  @ApiOperation({ summary: "Get data retention policy" })
  @Permissions("saas.portal.read")
  @Get("data-retention")
  async getDataRetentionPolicy(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return {
      retentionDays: settings.retentionDays ?? 365,
      autoDelete: settings.autoDelete ?? false,
      excludedTables: settings.excludedTables ?? [],
    };
  }

  @ApiOperation({ summary: "Update data retention policy" })
  @Permissions("saas.portal.create")
  @Put("data-retention")
  async updateDataRetentionPolicy(@Req() req: AuthReq, @ZodBody(updateRetentionSchema) body: z.infer<typeof updateRetentionSchema>) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    return prisma.tenant.update({ where: { id: req.user.tenantId }, data: { settings: { ...settings, ...body } as any } });
  }
}
