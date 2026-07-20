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
import { PlanEngineService } from "./plan-engine.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["BOOLEAN", "SEAT_LIMITED", "USAGE_LIMITED"]).default("BOOLEAN"),
  defaultValue: z.boolean().default(false),
});

const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(["BOOLEAN", "SEAT_LIMITED", "USAGE_LIMITED"]).optional(),
  defaultValue: z.boolean().optional(),
});

const evaluateAccessSchema = z.object({
  planId: z.string().min(1),
  featureKeys: z.array(z.string().min(1)),
  tenantAttributes: z.record(z.unknown()).optional(),
});

const assignFeatureSchema = z.object({
  featureKey: z.string().min(1).max(100),
  featureName: z.string().min(1).max(255),
  featureType: z.enum(["BOOLEAN", "SEAT_LIMITED", "USAGE_LIMITED"]).default("BOOLEAN"),
  limitValue: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

const createGateSchema = z.object({
  featureKey: z.string().min(1).max(100),
  gateExpression: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().int().min(0).default(0),
});

const updateGateSchema = createGateSchema.partial();

@ApiTags("saas-feature-flags")
@ApiBearerAuth()
@Controller("saas/feature-flags")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FeatureFlagsController {
  constructor(private readonly planEngineService: PlanEngineService) {}

  @ApiOperation({ summary: "List all feature flags" })
  @Permissions("saas.plan.read")
  @Get()
  async listFeatureFlags(@Req() req: AuthReq) {
    return this.planEngineService.listPlanFeatures(req.user.tenantId, "");
  }

  @ApiOperation({ summary: "Get a single feature flag by key" })
  @Permissions("saas.plan.read")
  @Get(":key")
  async getFeatureFlag(@Req() req: AuthReq, @Param("key") key: string) {
    const feature = await prisma.saaSPlanFeature.findFirst({
      where: { featureKey: key, plan: { subscriptions: { some: { tenantId: req.user.tenantId } } } },
    });
    return feature ?? { featureKey: key, notFound: true };
  }

  @ApiOperation({ summary: "Create a new feature flag" })
  @Permissions("saas.plan.create")
  @Post()
  async createFeatureFlag(@Req() req: AuthReq, @ZodBody(createFeatureFlagSchema) body: z.infer<typeof createFeatureFlagSchema>) {
    const plan = await prisma.saaSPlan.findFirst({
      where: { subscriptions: { some: { tenantId: req.user.tenantId } } },
    });
    if (!plan) return { error: "No plan found for tenant" };
    return this.planEngineService.addPlanFeature(req.user.tenantId, plan.id, {
      featureKey: body.key,
      featureName: body.name,
      featureType: body.type,
      featureValue: body.defaultValue.toString(),
      description: body.description,
      isHighlighted: false,
      sortOrder: 0,
    });
  }

  @ApiOperation({ summary: "Update a feature flag" })
  @Permissions("saas.plan.update")
  @Patch(":id")
  async updateFeatureFlag(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateFeatureFlagSchema) body: z.infer<typeof updateFeatureFlagSchema>) {
    return this.planEngineService.updatePlanFeature(req.user.tenantId, id, {
      featureName: body.name,
      description: body.description,
      featureType: body.type,
      featureValue: body.defaultValue?.toString(),
    });
  }

  @ApiOperation({ summary: "Delete a feature flag" })
  @Permissions("saas.plan.delete")
  @Delete(":id")
  async deleteFeatureFlag(@Req() req: AuthReq, @Param("id") id: string) {
    return this.planEngineService.removePlanFeature(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Evaluate feature access for a tenant" })
  @Permissions("saas.plan.read")
  @Post("evaluate")
  async evaluateFeatureAccess(@ZodBody(evaluateAccessSchema) body: z.infer<typeof evaluateAccessSchema>) {
    const features = await prisma.saaSPlanFeature.findMany({
      where: {
        featureKey: { in: body.featureKeys },
        planId: body.planId,
        isActive: true,
      },
    });
    const results: Record<string, boolean> = {};
    for (const key of body.featureKeys) {
      const feat = features.find((f) => f.featureKey === key);
      results[key] = feat ? feat.type !== "BOOLEAN" || true : false;
    }
    return { planId: body.planId, featureAccess: results };
  }

  @ApiOperation({ summary: "Get entitlements for the current tenant" })
  @Permissions("saas.plan.read")
  @Get("entitlements")
  async getMyEntitlements(@Req() req: AuthReq) {
    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId: req.user.tenantId },
      include: { plan: { include: { featureEntitlements: true } } },
    });
    return sub?.plan?.featureEntitlements ?? [];
  }

  @ApiOperation({ summary: "Get features for a specific plan" })
  @Permissions("saas.plan.read")
  @Get("plans/:planId")
  async getPlanFeatures(@Req() req: AuthReq, @Param("planId") planId: string) {
    return this.planEngineService.listPlanFeatures(req.user.tenantId, planId);
  }

  @ApiOperation({ summary: "Assign a feature to a plan" })
  @Permissions("saas.plan.update")
  @Post("plans/:planId/features")
  async assignFeatureToPlan(@Req() req: AuthReq, @Param("planId") planId: string, @ZodBody(assignFeatureSchema) body: z.infer<typeof assignFeatureSchema>) {
    return this.planEngineService.addPlanFeature(req.user.tenantId, planId, {
      featureKey: body.featureKey,
      featureName: body.featureName,
      featureType: body.featureType,
      featureValue: body.isActive ? "true" : "false",
      isHighlighted: false,
      sortOrder: 0,
    });
  }

  @ApiOperation({ summary: "Remove a feature from a plan" })
  @Permissions("saas.plan.update")
  @Delete("plans/:planId/features/:featureId")
  async removeFeatureFromPlan(@Req() req: AuthReq, @Param("planId") _planId: string, @Param("featureId") featureId: string) {
    return this.planEngineService.removePlanFeature(req.user.tenantId, featureId);
  }

  @ApiOperation({ summary: "List all feature gates" })
  @Permissions("saas.plan.read")
  @Get("gates")
  async listFeatureGates(@Req() req: AuthReq) {
    const features = await prisma.saaSPlanFeature.findMany({
      where: { plan: { subscriptions: { some: { tenantId: req.user.tenantId } } } },
    });
    return features.map((f) => ({
      id: f.id,
      featureKey: f.featureKey,
      gateExpression: f.type === "BOOLEAN" ? "always" : `limit:${f.limitValue ?? "unlimited"}`,
      description: f.description,
      priority: 0,
    }));
  }

  @ApiOperation({ summary: "Create a feature gate" })
  @Permissions("saas.plan.create")
  @Post("gates")
  async createFeatureGate(@Req() req: AuthReq, @ZodBody(createGateSchema) body: z.infer<typeof createGateSchema>) {
    const plan = await prisma.saaSPlan.findFirst({
      where: { subscriptions: { some: { tenantId: req.user.tenantId } } },
    });
    if (!plan) return { error: "No plan found" };
    return this.planEngineService.addPlanFeature(req.user.tenantId, plan.id, {
      featureKey: body.featureKey,
      featureName: body.featureKey,
      featureType: "BOOLEAN",
      featureValue: body.gateExpression,
      description: body.description,
      isHighlighted: false,
      sortOrder: body.priority,
    });
  }

  @ApiOperation({ summary: "Update a feature gate" })
  @Permissions("saas.plan.update")
  @Patch("gates/:id")
  async updateFeatureGate(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateGateSchema) body: z.infer<typeof updateGateSchema>) {
    return this.planEngineService.updatePlanFeature(req.user.tenantId, id, {
      featureName: body.featureKey,
      featureValue: body.gateExpression,
      description: body.description,
    });
  }

  @ApiOperation({ summary: "Compare feature flags across plans" })
  @Permissions("saas.plan.read")
  @Get("comparison")
  async comparePlanFeatures(@Req() req: AuthReq, @Query("planIds") planIds?: string) {
    const ids = planIds ? planIds.split(",").map((s) => s.trim()) : [];
    return this.planEngineService.comparePlans(req.user.tenantId, ids);
  }
}
