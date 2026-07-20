import {
  Controller,
  Get,
  Post,
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

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const submitAppReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  review: z.string().optional(),
});

const configureAppSchema = z.object({
  settings: z.record(z.unknown()),
});

@ApiTags("saas-marketplace")
@ApiBearerAuth()
@Controller("saas/marketplace")
@UseGuards(JwtAuthGuard, RbacGuard)
export class MarketplaceController {
  constructor(private readonly saasService: SaasService) {}

  private readonly appsCatalog = [
    { id: "crm", name: "CRM", slug: "crm", description: "Customer Relationship Management", category: "sales" },
    { id: "hr", name: "HR", slug: "hr", description: "Human Resources", category: "people" },
    { id: "finance", name: "Finance", slug: "finance", description: "Finance & Accounting", category: "finance" },
    { id: "inventory", name: "Inventory", slug: "inventory", description: "Inventory Management", category: "operations" },
    { id: "projects", name: "Projects", slug: "projects", description: "Project Management", category: "operations" },
    { id: "manufacturing", name: "Manufacturing", slug: "manufacturing", description: "Manufacturing MRP", category: "operations" },
  ];

  @ApiOperation({ summary: "List marketplace apps" })
  @Permissions("saas.marketplace.read")
  @Get("apps")
  async listMarketplaceApps(@Req() _req: AuthReq) {
    return this.appsCatalog;
  }

  @ApiOperation({ summary: "Get marketplace app" })
  @Permissions("saas.marketplace.read")
  @Get("apps/:id")
  async getMarketplaceApp(@Req() _req: AuthReq, @Param("id") id: string) {
    return this.appsCatalog.find((a) => a.id === id) || null;
  }

  @ApiOperation({ summary: "List categories" })
  @Permissions("saas.marketplace.read")
  @Get("categories")
  async listCategories(@Req() _req: AuthReq) {
    return [
      { id: "sales", name: "Sales & CRM", count: 1 },
      { id: "finance", name: "Finance", count: 1 },
      { id: "people", name: "People & HR", count: 1 },
      { id: "operations", name: "Operations", count: 3 },
    ];
  }

  @ApiOperation({ summary: "Search apps" })
  @Permissions("saas.marketplace.read")
  @Get("search")
  async searchApps(@Req() _req: AuthReq, @Query("q") q?: string) {
    if (!q) return this.appsCatalog;
    const query = q.toLowerCase();
    return this.appsCatalog.filter((a) => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query));
  }

  @ApiOperation({ summary: "Get recommended apps" })
  @Permissions("saas.marketplace.read")
  @Get("recommended")
  async getRecommendedApps(@Req() req: AuthReq) {
    const installed: string[] = await this.saasService.getInstalledApps(req.user.tenantId).catch(() => []);
    return this.appsCatalog.filter((a) => !installed.includes(a.id) && !installed.includes(a.slug)).slice(0, 3);
  }

  @ApiOperation({ summary: "Get featured apps" })
  @Permissions("saas.marketplace.read")
  @Get("featured")
  async getFeaturedApps(@Req() _req: AuthReq) {
    return this.appsCatalog;
  }

  @ApiOperation({ summary: "Install marketplace app" })
  @Permissions("saas.marketplace.read")
  @Post("apps/:id/install")
  async installMarketplaceApp(@Req() req: AuthReq, @Param("id") id: string) {
    return this.saasService.installApp(req.user.tenantId, id).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Uninstall marketplace app" })
  @Permissions("saas.marketplace.read")
  @Post("apps/:id/uninstall")
  async uninstallMarketplaceApp(@Req() req: AuthReq, @Param("id") id: string) {
    return this.saasService.uninstallApp(req.user.tenantId, id).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Submit app review" })
  @Permissions("saas.marketplace.read")
  @Post("apps/:id/review")
  async submitAppReview(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(submitAppReviewSchema) body: z.infer<typeof submitAppReviewSchema>) {
    return { success: true, appId: id, rating: body.rating, title: body.title };
  }

  @ApiOperation({ summary: "Get app reviews" })
  @Permissions("saas.marketplace.read")
  @Get("apps/:id/reviews")
  async getAppReviews(@Req() _req: AuthReq, @Param("id") id: string) {
    return { appId: id, reviews: [], averageRating: 0, total: 0 };
  }

  @ApiOperation({ summary: "Get my installed apps" })
  @Permissions("saas.marketplace.read")
  @Get("my-installs")
  async getMyInstalledApps(@Req() req: AuthReq) {
    return this.saasService.getInstalledApps(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Configure app" })
  @Permissions("saas.marketplace.read")
  @Post("apps/:id/configure")
  async configureApp(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(configureAppSchema) body: z.infer<typeof configureAppSchema>) {
    return { success: true, appId: id, settings: body.settings };
  }

  @ApiOperation({ summary: "Get app versions" })
  @Permissions("saas.marketplace.read")
  @Get("apps/:id/versions")
  async getAppVersions(@Req() _req: AuthReq, @Param("id") id: string) {
    return { appId: id, versions: [{ version: "1.0.0", releasedAt: "2024-01-01", changelog: "Initial release" }] };
  }

  @ApiOperation({ summary: "Upgrade marketplace app" })
  @Permissions("saas.marketplace.read")
  @Post("apps/:id/upgrade")
  async upgradeMarketplaceApp(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, appId: id, upgradedTo: "1.0.0" };
  }

  @ApiOperation({ summary: "List bundles" })
  @Permissions("saas.marketplace.read")
  @Get("bundles")
  async listBundles(@Req() _req: AuthReq) {
    return [
      { id: "starter", name: "Starter Bundle", apps: ["crm", "finance"], price: 0, currency: "USD" },
      { id: "business", name: "Business Bundle", apps: ["crm", "finance", "hr", "inventory"], price: 49, currency: "USD" },
      { id: "enterprise", name: "Enterprise Bundle", apps: ["crm", "finance", "hr", "inventory", "projects", "manufacturing"], price: 199, currency: "USD" },
    ];
  }
}
