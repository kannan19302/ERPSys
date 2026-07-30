import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingJobCostService } from "./manufacturing-job-cost.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string };
}

const createSheetSchema = z.object({
  workOrderId: z.string().min(1),
  productId: z.string().optional(),
  plannedMaterialCost: z.number().optional(),
  plannedLaborCost: z.number().optional(),
  plannedOverheadCost: z.number().optional(),
  currency: z.string().optional(),
});

const addEntrySchema = z.object({
  costType: z.enum([
    "MATERIAL",
    "LABOR",
    "OVERHEAD",
    "SCRAP",
    "REWORK",
    "OTHER",
  ]),
  description: z.string().optional(),
  quantity: z.number().optional(),
  unitCost: z.number().optional(),
  amount: z.number(),
  currency: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
});

const createStandardCostSchema = z.object({
  productId: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().optional(),
  materialCost: z.number().nonnegative(),
  laborCost: z.number().nonnegative(),
  overheadCost: z.number().nonnegative(),
  currency: z.string().optional(),
});

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/job-cost")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingJobCostController {
  constructor(private readonly jobCostService: ManufacturingJobCostService) {}

  @ApiOperation({ summary: "Create job cost sheet" })
  @Permissions("manufacturing.job-cost.create")
  @Post("sheets")
  async createJobCostSheet(
    @Req() req: AuthReq,
    @ZodBody(createSheetSchema) body: z.infer<typeof createSheetSchema>,
  ) {
    return this.jobCostService.createJobCostSheet(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get all job cost sheets" })
  @Permissions("manufacturing.job-cost.read")
  @Get("sheets")
  async getJobCostSheets(@Req() req: AuthReq) {
    return this.jobCostService.getJobCostSheets(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get job cost sheet by ID" })
  @Permissions("manufacturing.job-cost.read")
  @Get("sheets/:id")
  async getJobCostSheetById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.jobCostService.getJobCostSheetById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Add cost entry to sheet" })
  @Permissions("manufacturing.job-cost.create")
  @Post("sheets/:id/entries")
  async addCostEntry(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(addEntrySchema) body: z.infer<typeof addEntrySchema>,
  ) {
    return this.jobCostService.addCostEntry(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Close job cost sheet" })
  @Permissions("manufacturing.job-cost.create")
  @Post("sheets/:id/close")
  async closeCostSheet(@Req() req: AuthReq, @Param("id") id: string) {
    return this.jobCostService.closeCostSheet(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create standard cost record" })
  @Permissions("manufacturing.job-cost.create")
  @Post("standard-costs")
  async createStandardCost(
    @Req() req: AuthReq,
    @ZodBody(createStandardCostSchema)
    body: z.infer<typeof createStandardCostSchema>,
  ) {
    return this.jobCostService.createStandardCost(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get standard costs" })
  @Permissions("manufacturing.job-cost.read")
  @Get("standard-costs")
  async getStandardCosts(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.jobCostService.getStandardCosts(req.user.tenantId, productId);
  }

  @ApiOperation({ summary: "Get job cost dashboard" })
  @Permissions("manufacturing.job-cost.read")
  @Get("dashboard")
  async getJobCostDashboard(@Req() req: AuthReq) {
    return this.jobCostService.getJobCostDashboard(req.user.tenantId);
  }
}
