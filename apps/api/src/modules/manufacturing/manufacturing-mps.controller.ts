import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingMpsService } from "./manufacturing-mps.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string };
}

const createMpsSchema = z.object({
  name: z.string().min(1),
  planningHorizon: z.number().int().positive(),
  planningUnit: z.enum(["WEEKS", "DAYS", "MONTHS"]).optional(),
  frozenPeriod: z.number().int().optional(),
  demandSource: z.string().optional(),
  safetyStockDays: z.number().int().optional(),
  entries: z
    .array(
      z.object({
        productId: z.string().min(1),
        period: z.string().min(1),
        forecastDemand: z.number().nonnegative(),
        actualDemand: z.number().optional(),
        openOrders: z.number().optional(),
      }),
    )
    .optional(),
});

const updateEntrySchema = z.object({
  forecastDemand: z.number().optional(),
  actualDemand: z.number().optional(),
  openOrders: z.number().optional(),
  plannedProd: z.number().optional(),
});

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/mps")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingMpsController {
  constructor(private readonly mpsService: ManufacturingMpsService) {}

  @ApiOperation({ summary: "Create MPS schedule" })
  @Permissions("manufacturing.mps.create")
  @Post()
  async createMps(
    @Req() req: AuthReq,
    @ZodBody(createMpsSchema) body: z.infer<typeof createMpsSchema>,
  ) {
    return this.mpsService.createMps(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get all MPS schedules" })
  @Permissions("manufacturing.mps.read")
  @Get()
  async getMpsList(@Req() req: AuthReq) {
    return this.mpsService.getMpsList(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get MPS by ID" })
  @Permissions("manufacturing.mps.read")
  @Get(":id")
  async getMpsById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.mpsService.getMpsById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Approve MPS schedule" })
  @Permissions("manufacturing.mps.create")
  @Post(":id/approve")
  async approveMps(@Req() req: AuthReq, @Param("id") id: string) {
    return this.mpsService.approveMps(req.user.tenantId, id, req.user.email);
  }

  @ApiOperation({ summary: "Update MPS entry" })
  @Permissions("manufacturing.mps.create")
  @Patch("entries/:entryId")
  async updateMpsEntry(
    @Req() req: AuthReq,
    @Param("entryId") entryId: string,
    @ZodBody(updateEntrySchema) body: z.infer<typeof updateEntrySchema>,
  ) {
    return this.mpsService.updateMpsEntry(req.user.tenantId, entryId, body);
  }

  @ApiOperation({ summary: "Get MPS dashboard" })
  @Permissions("manufacturing.mps.read")
  @Get("dashboard/summary")
  async getMpsDashboard(@Req() req: AuthReq) {
    return this.mpsService.getMpsDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: "Calculate ATP for MPS entries" })
  @Permissions("manufacturing.mps.create")
  @Post(":id/calculate-atp")
  async calculateAvailableToPromise(
    @Req() req: AuthReq,
    @Param("id") id: string,
  ) {
    return this.mpsService.calculateAvaialableToPromise(req.user.tenantId, id);
  }
}
