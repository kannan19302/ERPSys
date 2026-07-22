import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplierPerformanceService } from "../services/supplier-performance.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createKpiSchema = z.object({
  vendorId: z.string().min(1),
  kpiName: z.string().min(1),
  category: z.string().optional(),
  target: z.number(),
  actual: z.number(),
  weight: z.number().optional(),
  period: z.string(),
  notes: z.string().optional(),
});

const updateKpiSchema = createKpiSchema.partial();

const calculateScorecardSchema = z.object({
  vendorId: z.string().min(1),
  periodStart: z.string(),
  periodEnd: z.string(),
});

@ApiTags("supply-chain / supplier-performance")
@ApiBearerAuth()
@Controller("supply-chain/supplier-performance")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierPerformanceController {
  constructor(private readonly svc: SupplierPerformanceService) {}

  @Get("kpis")
  @Permissions("supply-chain.performance.read")
  @ApiOperation({ summary: "List supplier KPI definitions" })
  listKpis(@Req() req: AuthRequest, @Query("vendorId") vendorId?: string) {
    return this.svc.listKpis(req.user.tenantId, vendorId);
  }

  @Post("kpis")
  @Permissions("supply-chain.performance.create")
  @ApiOperation({ summary: "Create supplier KPI" })
  @HttpCode(HttpStatus.CREATED)
  createKpi(@Req() req: AuthRequest, @ZodBody(createKpiSchema) body: z.infer<typeof createKpiSchema>) {
    return this.svc.createKpi(req.user.tenantId, body);
  }

  @Patch("kpis/:id")
  @Permissions("supply-chain.performance.update")
  @ApiOperation({ summary: "Update supplier KPI" })
  updateKpi(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(updateKpiSchema) body: z.infer<typeof updateKpiSchema>) {
    return this.svc.updateKpi(req.user.tenantId, id, body);
  }

  @Delete("kpis/:id")
  @Permissions("supply-chain.performance.delete")
  @ApiOperation({ summary: "Delete supplier KPI" })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteKpi(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.deleteKpi(req.user.tenantId, id);
  }

  @Get("scorecards")
  @Permissions("supply-chain.performance.read")
  @ApiOperation({ summary: "Get supplier scorecards" })
  getScorecards(@Req() req: AuthRequest, @Query("vendorId") vendorId?: string, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.svc.getScorecards(req.user.tenantId, { vendorId, periodStart, periodEnd });
  }

  @Post("scorecards/calculate")
  @Permissions("supply-chain.performance.create")
  @ApiOperation({ summary: "Calculate supplier scorecard for a period" })
  @HttpCode(HttpStatus.CREATED)
  calculateScorecard(@Req() req: AuthRequest, @ZodBody(calculateScorecardSchema) body: z.infer<typeof calculateScorecardSchema>) {
    return this.svc.calculateScorecard(req.user.tenantId, body);
  }

  @Get("trend/:vendorId")
  @Permissions("supply-chain.performance.read")
  @ApiOperation({ summary: "Get performance trend for a vendor" })
  getVendorTrend(@Req() req: AuthRequest, @Param("vendorId") vendorId: string) {
    return this.svc.getVendorTrend(req.user.tenantId, vendorId);
  }
}
