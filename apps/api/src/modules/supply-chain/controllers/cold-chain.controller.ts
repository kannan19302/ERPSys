// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ColdChainService } from "../services/cold-chain.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createShipmentSchema = z.object({
  shipmentRef: z.string().min(1),
  productId: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  requiredTempMin: z.number().optional(),
  requiredTempMax: z.number().optional(),
  humidity: z.number().optional(),
  packagingType: z.string().optional(),
  coolingMethod: z.string().optional(),
  status: z.string().optional(),
});

const updateShipmentSchema = createShipmentSchema.partial();

const logTemperatureSchema = z.object({
  temperature: z.number(),
  humidity: z.number().optional(),
  location: z.string().optional(),
  deviceId: z.string().optional(),
  recordedAt: z.string().optional(),
});

const batchLogTemperatureSchema = z.object({
  logs: z.array(logTemperatureSchema).min(1).max(1000),
});

const resolveExcursionSchema = z.object({
  action: z.string().min(1),
  dispositionDecision: z.string().min(1),
  approvedBy: z.string().min(1),
});

const createRequirementSchema = z.object({
  productId: z.string().min(1),
  minTempCelsius: z.number(),
  maxTempCelsius: z.number(),
  minHumidityPct: z.number().optional(),
  maxHumidityPct: z.number().optional(),
  packagingType: z.string().optional(),
  temperatureUnit: z.string().optional(),
});

const updateRequirementSchema = createRequirementSchema.partial();

@ApiTags("supply-chain / cold-chain")
@ApiBearerAuth()
@Controller("supply-chain/cold-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ColdChainController {
  constructor(private readonly svc: ColdChainService) {}

  @Get("dashboard")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Cold chain telematics dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get("shipments")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List cold chain shipments" })
  listShipments(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("productId") productId?: string,
    @Query("origin") origin?: string,
    @Query("destination") destination?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.svc.listShipments(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      productId,
      origin,
      destination,
      startDate,
      endDate,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });
  }

  @Get("shipments/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get cold chain shipment detail" })
  getShipment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getShipment(req.user.tenantId, id);
  }

  @Post("shipments")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Create cold chain shipment" })
  @HttpCode(HttpStatus.CREATED)
  createShipment(
    @Req() req: AuthRequest,
    @ZodBody(createShipmentSchema) body: z.infer<typeof createShipmentSchema>,
  ) {
    return this.svc.createShipment(req.user.tenantId, body, req.user.userId);
  }

  @Patch("shipments/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Update cold chain shipment" })
  updateShipment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateShipmentSchema) body: z.infer<typeof updateShipmentSchema>,
  ) {
    return this.svc.updateShipment(req.user.tenantId, id, body);
  }

  @Delete("shipments/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Delete cold chain shipment" })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteShipment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.deleteShipment(req.user.tenantId, id);
  }

  @Post("shipments/:id/depart")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Mark cold chain shipment as departed" })
  departShipment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.departShipment(req.user.tenantId, id);
  }

  @Post("shipments/:id/arrive")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Mark cold chain shipment as arrived" })
  arriveShipment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.arriveShipment(req.user.tenantId, id);
  }

  @Post("shipments/:id/temperature")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Log temperature reading" })
  @HttpCode(HttpStatus.CREATED)
  logTemperature(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(logTemperatureSchema) body: z.infer<typeof logTemperatureSchema>,
  ) {
    return this.svc.logTemperature(req.user.tenantId, id, body);
  }

  @Post("shipments/:id/temperature/batch")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Batch log temperature readings" })
  @HttpCode(HttpStatus.CREATED)
  batchLogTemperature(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(batchLogTemperatureSchema)
    body: z.infer<typeof batchLogTemperatureSchema>,
  ) {
    return this.svc.batchLogTemperature(req.user.tenantId, id, body.logs);
  }

  @Get("temperature-logs")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List temperature logs" })
  listTemperatureLogs(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("shipmentId") shipmentId?: string,
    @Query("deviceId") deviceId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.listTemperatureLogs(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      shipmentId,
      deviceId,
      startDate,
      endDate,
    });
  }

  @Get("temperature-logs/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get temperature log by id" })
  getTemperatureLog(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getTemperatureLogById(req.user.tenantId, id);
  }

  @Get("excursions")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List temperature excursions" })
  listExcursions(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("shipmentId") shipmentId?: string,
    @Query("excursionType") excursionType?: string,
    @Query("severity") severity?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.listExcursions(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      shipmentId,
      excursionType,
      severity,
      status,
      startDate,
      endDate,
    });
  }

  @Get("excursions/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get excursion detail" })
  getExcursion(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getExcursion(req.user.tenantId, id);
  }

  @Post("excursions/:id/resolve")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Resolve a temperature excursion" })
  resolveExcursion(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(resolveExcursionSchema)
    body: z.infer<typeof resolveExcursionSchema>,
  ) {
    return this.svc.resolveExcursion(req.user.tenantId, id, body);
  }

  @Get("fleet-analytics")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Cold chain fleet analytics" })
  getFleetAnalytics(@Req() req: AuthRequest) {
    return this.svc.getFleetAnalytics(req.user.tenantId);
  }

  @Get("sensor-analytics")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Sensor telematics analytics" })
  getSensorAnalytics(@Req() req: AuthRequest) {
    return this.svc.getSensorAnalytics(req.user.tenantId);
  }

  @Get("compliance-report")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Cold chain compliance report" })
  getComplianceReport(
    @Req() req: AuthRequest,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.getComplianceReport(req.user.tenantId, {
      startDate,
      endDate,
    });
  }

  // ─── Requirements ──────────────────────────────────────────────────

  @Get("requirements")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List cold chain requirements" })
  listRequirements(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("productId") productId?: string,
  ) {
    return this.svc.listRequirements(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      productId,
    });
  }

  @Post("requirements")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Create cold chain requirement" })
  @HttpCode(HttpStatus.CREATED)
  createRequirement(
    @Req() req: AuthRequest,
    @ZodBody(createRequirementSchema)
    body: z.infer<typeof createRequirementSchema>,
  ) {
    return this.svc.createRequirement(req.user.tenantId, body);
  }

  @Patch("requirements/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Update cold chain requirement" })
  updateRequirement(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateRequirementSchema)
    body: z.infer<typeof updateRequirementSchema>,
  ) {
    return this.svc.updateRequirement(req.user.tenantId, id, body);
  }

  @Delete("requirements/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Delete cold chain requirement" })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRequirement(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.deleteRequirement(req.user.tenantId, id);
  }

  @Get("open-excursions-count")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get count of open excursions" })
  getOpenExcursionCount(@Req() req: AuthRequest) {
    return this.svc.getOpenExcursionCount(req.user.tenantId);
  }

  @Get("telematics/overview")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Telematics monitoring overview" })
  getTelematicsOverview(@Req() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get("telematics/alerts")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Active telematics alerts" })
  getTelematicsAlerts(@Req() req: AuthRequest) {
    return this.svc.listExcursions(req.user.tenantId, {
      status: "OPEN",
      limit: 50,
    });
  }
}
