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

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("USD"),
  interval: z.enum(["month", "year", "week", "day"]).default("month"),
  maxUsers: z.number().int().min(1),
  maxStorage: z.number().int().min(0),
  maxApiCalls: z.number().int().min(0).default(10000),
  trialPeriodDays: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

const updatePlanSchema = createPlanSchema.partial();

const setPriceSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().min(1),
  interval: z.enum(["month", "year", "week", "day"]),
  billingPeriods: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  stripePriceId: z.string().optional(),
});

const updatePriceSchema = setPriceSchema.partial();

const addFeatureSchema = z.object({
  featureKey: z.string().min(1).max(100),
  featureName: z.string().min(1).max(255),
  featureType: z.enum(["boolean", "numeric", "text", "select"]).default("boolean"),
  featureValue: z.string().optional(),
  description: z.string().optional(),
  isHighlighted: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const updateFeatureSchema = addFeatureSchema.partial();

@ApiTags("saas-plans")
@ApiBearerAuth()
@Controller("saas/plans")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PlanEngineController {
  constructor(private readonly planEngineService: PlanEngineService) {}

  @ApiOperation({ summary: "List all plans" })
  @Permissions("saas.plan.read")
  @Get()
  async listPlans(@Req() req: AuthReq) {
    return this.planEngineService.listPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get plan by id" })
  @Permissions("saas.plan.read")
  @Get(":id")
  async getPlan(@Req() req: AuthReq, @Param("id") id: string) {
    return this.planEngineService.getPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create new plan" })
  @Permissions("saas.plan.create")
  @Post()
  async createPlan(@Req() req: AuthReq, @ZodBody(createPlanSchema) body: z.infer<typeof createPlanSchema>) {
    return this.planEngineService.createPlan(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update plan" })
  @Permissions("saas.plan.update")
  @Patch(":id")
  async updatePlan(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updatePlanSchema) body: z.infer<typeof updatePlanSchema>) {
    return this.planEngineService.updatePlan(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete plan" })
  @Permissions("saas.plan.delete")
  @Delete(":id")
  async deletePlan(@Req() req: AuthReq, @Param("id") id: string) {
    return this.planEngineService.deletePlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Compare plans" })
  @Permissions("saas.plan.read")
  @Get("comparison")
  async comparePlans(@Req() req: AuthReq, @Query("ids") ids: string) {
    const planIds = ids ? ids.split(",").map((s) => s.trim()) : [];
    return this.planEngineService.comparePlans(req.user.tenantId, planIds);
  }

  @ApiOperation({ summary: "Get recommended plan" })
  @Permissions("saas.plan.read")
  @Get("recommended")
  async getRecommended(@Req() req: AuthReq) {
    return this.planEngineService.getRecommended(req.user.tenantId);
  }

  @ApiOperation({ summary: "List plan prices" })
  @Permissions("saas.pricing.read")
  @Get(":id/prices")
  async listPlanPrices(@Req() req: AuthReq, @Param("id") id: string) {
    return this.planEngineService.listPlanPrices(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Set plan price" })
  @Permissions("saas.pricing.create")
  @Post(":id/prices")
  async setPlanPrice(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(setPriceSchema) body: z.infer<typeof setPriceSchema>) {
    return this.planEngineService.setPlanPrice(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Update plan price" })
  @Permissions("saas.pricing.update")
  @Patch("prices/:priceId")
  async updatePlanPrice(@Req() req: AuthReq, @Param("priceId") priceId: string, @ZodBody(updatePriceSchema) body: z.infer<typeof updatePriceSchema>) {
    return this.planEngineService.updatePlanPrice(req.user.tenantId, priceId, body);
  }

  @ApiOperation({ summary: "Delete plan price" })
  @Permissions("saas.pricing.delete")
  @Delete("prices/:priceId")
  async deletePlanPrice(@Req() req: AuthReq, @Param("priceId") priceId: string) {
    return this.planEngineService.deletePlanPrice(req.user.tenantId, priceId);
  }

  @ApiOperation({ summary: "List plan features" })
  @Permissions("saas.plan.read")
  @Get(":id/features")
  async listPlanFeatures(@Req() req: AuthReq, @Param("id") id: string) {
    return this.planEngineService.listPlanFeatures(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Add plan feature" })
  @Permissions("saas.plan.update")
  @Post(":id/features")
  async addPlanFeature(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(addFeatureSchema) body: z.infer<typeof addFeatureSchema>) {
    return this.planEngineService.addPlanFeature(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Update plan feature" })
  @Permissions("saas.plan.update")
  @Patch("features/:featureId")
  async updatePlanFeature(@Req() req: AuthReq, @Param("featureId") featureId: string, @ZodBody(updateFeatureSchema) body: z.infer<typeof updateFeatureSchema>) {
    return this.planEngineService.updatePlanFeature(req.user.tenantId, featureId, body);
  }

  @ApiOperation({ summary: "Remove plan feature" })
  @Permissions("saas.plan.update")
  @Delete("features/:featureId")
  async removePlanFeature(@Req() req: AuthReq, @Param("featureId") featureId: string) {
    return this.planEngineService.removePlanFeature(req.user.tenantId, featureId);
  }
}
