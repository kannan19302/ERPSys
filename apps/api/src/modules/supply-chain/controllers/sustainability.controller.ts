import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplyChainSustainabilityService } from "../services/supply-chain-sustainability.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const emissionsCalcSchema = z.object({
  shipmentId: z.string().optional(),
  transportMode: z.string().min(1),
  distanceKm: z.number().positive(),
  weightKg: z.number().positive(),
  fuelType: z.string().optional(),
});
const targetSchema = z.object({
  targetName: z.string().min(1),
  targetType: z.string().min(1),
  baselineYear: z.number().int(),
  baselineValue: z.number(),
  targetValue: z.number(),
  targetYear: z.number().int(),
  targetUnit: z.string().min(1),
  currentValue: z.number().optional(),
});
const progressSchema = z.object({ currentValue: z.number() });
const offsetSchema = z.object({
  offsetType: z.string().min(1),
  quantityTons: z.number().positive(),
  cost: z.number().positive(),
  supplierName: z.string().min(1),
  projectName: z.string().optional(),
  certification: z.string().optional(),
  purchaseDate: z.string(),
  expiryDate: z.string().optional(),
});
const esgReportSchema = z.object({
  reportType: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  framework: z.string().optional(),
});

@ApiTags("supply-chain / sustainability")
@ApiBearerAuth()
@Controller("supply-chain/sustainability")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SustainabilityController {
  constructor(private readonly svc: SupplyChainSustainabilityService) {}

  @Get("dashboard")
  @Permissions("supply-chain.sustainability.read")
  @ApiOperation({ summary: "Sustainability dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getSustainabilityDashboard(req.user.tenantId);
  }

  @Post("emissions/calculate")
  @Permissions("supply-chain.sustainability.create")
  @ApiOperation({ summary: "Calculate shipment emissions" })
  @HttpCode(HttpStatus.CREATED)
  calculateEmissions(
    @Req() req: AuthRequest,
    @ZodBody(emissionsCalcSchema) body: z.infer<typeof emissionsCalcSchema>,
  ) {
    return this.svc.calculateShipmentEmissions(req.user.tenantId, body);
  }

  @Get("emissions")
  @Permissions("supply-chain.sustainability.read")
  @ApiOperation({ summary: "List emission records" })
  listEmissions(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("transportMode") transportMode?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.listShipmentEmissions(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      transportMode,
      startDate,
      endDate,
    });
  }

  @Post("targets")
  @Permissions("supply-chain.sustainability.create")
  @ApiOperation({ summary: "Set sustainability target" })
  @HttpCode(HttpStatus.CREATED)
  setTarget(
    @Req() req: AuthRequest,
    @ZodBody(targetSchema) body: z.infer<typeof targetSchema>,
  ) {
    return this.svc.setSustainabilityTarget(req.user.tenantId, body);
  }

  @Get("targets")
  @Permissions("supply-chain.sustainability.read")
  @ApiOperation({ summary: "List sustainability targets" })
  listTargets(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("targetType") targetType?: string,
    @Query("status") status?: string,
  ) {
    return this.svc.listSustainabilityTargets(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      targetType,
      status,
    });
  }

  @Patch("targets/:id/progress")
  @Permissions("supply-chain.sustainability.update")
  @ApiOperation({ summary: "Update target progress" })
  updateProgress(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(progressSchema) body: z.infer<typeof progressSchema>,
  ) {
    return this.svc.updateTargetProgress(req.user.tenantId, id, body);
  }

  @Post("offsets")
  @Permissions("supply-chain.sustainability.create")
  @ApiOperation({ summary: "Log carbon offset purchase" })
  @HttpCode(HttpStatus.CREATED)
  logOffset(
    @Req() req: AuthRequest,
    @ZodBody(offsetSchema) body: z.infer<typeof offsetSchema>,
  ) {
    return this.svc.logOffsetPurchase(req.user.tenantId, body);
  }

  @Get("offsets")
  @Permissions("supply-chain.sustainability.read")
  @ApiOperation({ summary: "List carbon offsets" })
  listOffsets(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("offsetType") offsetType?: string,
  ) {
    return this.svc.listOffsets(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      offsetType,
    });
  }

  @Post("esg-report")
  @Permissions("supply-chain.sustainability.read")
  @ApiOperation({ summary: "Generate ESG report" })
  generateESGReport(
    @Req() req: AuthRequest,
    @ZodBody(esgReportSchema) body: z.infer<typeof esgReportSchema>,
  ) {
    return this.svc.generateESGReport(req.user.tenantId, body);
  }
}
