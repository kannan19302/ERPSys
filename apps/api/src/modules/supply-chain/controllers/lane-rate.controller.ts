import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LaneRateService } from "../services/lane-rate.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createSchema = z.object({
  carrierId: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  transportMode: z.enum(["ROAD", "RAIL", "AIR", "SEA", "MULTIMODAL"]),
  containerType: z.string().optional(),
  ratePerUnit: z.number(),
  rateUnit: z.string().optional(),
  currency: z.string().optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  transitTime: z.number().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

@ApiTags("supply-chain / lane-rates")
@ApiBearerAuth()
@Controller("supply-chain/lane-rates")
@UseGuards(JwtAuthGuard, RbacGuard)
export class LaneRateController {
  constructor(private readonly svc: LaneRateService) {}

  @Get()
  @Permissions("supply-chain.lanerate.read")
  @ApiOperation({ summary: "List lane rates" })
  list(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("carrierId") carrierId?: string, @Query("origin") origin?: string, @Query("destination") destination?: string, @Query("transportMode") transportMode?: string) {
    return this.svc.list(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, carrierId, origin, destination, transportMode });
  }

  @Get("best-rate")
  @Permissions("supply-chain.lanerate.read")
  @ApiOperation({ summary: "Find best rate for a lane" })
  findBestRate(@Req() req: AuthRequest, @Query("origin") origin?: string, @Query("destination") destination?: string, @Query("transportMode") transportMode?: string, @Query("weight") weight?: string) {
    return this.svc.findBestRate(req.user.tenantId, { origin, destination, transportMode, weight: weight ? Number(weight) : undefined });
  }

  @Get("analytics")
  @Permissions("supply-chain.lanerate.read")
  @ApiOperation({ summary: "Get lane rate analytics" })
  getLaneAnalytics(@Req() req: AuthRequest) {
    return this.svc.getLaneAnalytics(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("supply-chain.lanerate.read")
  @ApiOperation({ summary: "Get lane rate by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.lanerate.create")
  @ApiOperation({ summary: "Create lane rate" })
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @ZodBody(createSchema) body: z.infer<typeof createSchema>) {
    return this.svc.create(req.user.tenantId, body, req.user.userId);
  }

  @Patch(":id")
  @Permissions("supply-chain.lanerate.update")
  @ApiOperation({ summary: "Update lane rate" })
  update(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(updateSchema) body: z.infer<typeof updateSchema>) {
    return this.svc.update(req.user.tenantId, id, body, req.user.userId);
  }

  @Delete(":id")
  @Permissions("supply-chain.lanerate.delete")
  @ApiOperation({ summary: "Delete lane rate" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }
}
