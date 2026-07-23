import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../../common/interceptors/change-history.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LogisticsExecutionService } from "../services/logistics-execution.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createLoadBuildSchema = z.object({
  loadType: z.string().optional(), transportMode: z.string().optional(),
  carrierId: z.string().optional(), carrierName: z.string().optional(),
  vehicleNumber: z.string().optional(), driverName: z.string().optional(),
  driverContact: z.string().optional(), originName: z.string().optional(),
  destName: z.string().optional(), scheduledPickup: z.string().optional(),
  scheduledDelivery: z.string().optional(), totalWeight: z.number().optional(),
  totalVolume: z.number().optional(), totalPallets: z.number().int().optional(),
  totalCartons: z.number().int().optional(), estimatedCost: z.number().optional(),
  bolNumber: z.string().optional(), temperatureReq: z.string().optional(),
  hazmat: z.boolean().optional(), notes: z.string().optional(),
  stops: z.array(z.object({ stopSequence: z.number().int(), stopType: z.string().optional(), locationName: z.string().optional(), address: z.string().optional(), scheduledArrival: z.string().optional(), scheduledDeparture: z.string().optional(), contactPerson: z.string().optional(), contactPhone: z.string().optional() })).optional(),
  items: z.array(z.object({ productId: z.string().optional(), productSku: z.string().optional(), productName: z.string().optional(), quantity: z.number().positive(), uom: z.string().optional(), weight: z.number().optional(), volume: z.number().optional(), palletCount: z.number().int().optional(), cartonCount: z.number().int().optional() })).optional(),
});

const createAppointmentSchema = z.object({
  appointmentType: z.string(), carrierId: z.string().optional(),
  carrierName: z.string().optional(), carrierContact: z.string().optional(),
  vehicleNumber: z.string().optional(), warehouseId: z.string().optional(),
  dockDoor: z.string().optional(), scheduledStart: z.string(),
  scheduledEnd: z.string().optional(), poNumbers: z.string().optional(),
  referenceNumber: z.string().optional(), driverName: z.string().optional(),
  driverPhone: z.string().optional(), totalWeight: z.number().optional(),
  totalPallets: z.number().int().optional(), totalCartons: z.number().int().optional(),
  notes: z.string().optional(),
});

const createPodSchema = z.object({
  shipmentId: z.string().optional(), shipmentType: z.string().optional(),
  receivedBy: z.string().optional(), signatureName: z.string().optional(),
  damageNotes: z.string().optional(), carrierName: z.string().optional(),
  driverName: z.string().optional(), lat: z.number().optional(),
  lng: z.number().optional(), notes: z.string().optional(),
  lines: z.array(z.object({ productId: z.string().optional(), productSku: z.string().optional(), productName: z.string().optional(), expectedQty: z.number().positive(), deliveredQty: z.number().positive(), damagedQty: z.number().optional(), rejectedQty: z.number().optional(), condition: z.string().optional(), notes: z.string().optional() })),
});

@ApiTags("supply-chain / logistics")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class LogisticsExecutionController {
  constructor(private readonly logiSvc: LogisticsExecutionService) {}

  @Get("transport-modes")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "List transport modes" })
  listTransportModes(@Req() req: AuthRequest) {
    return this.logiSvc.getTransportModes(req.user.tenantId);
  }

  @Post("transport-modes")
  @Permissions("supply-chain.freight.create")
  @TrackChanges("TransportMode")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a transport mode" })
  createTransportMode(@Req() req: AuthRequest, @ZodBody(z.object({ code: z.string(), name: z.string(), description: z.string().optional(), scacCode: z.string().optional() })) body: any) {
    return this.logiSvc.createTransportMode(req.user.tenantId, body);
  }

  @Get("carrier-rates")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "List carrier rates with filters" })
  listCarrierRates(@Req() req: AuthRequest, @Query("carrierId") carrierId?: string, @Query("originZip") originZip?: string, @Query("destZip") destZip?: string) {
    return this.logiSvc.getCarrierRates(req.user.tenantId, { carrierId, originZip, destZip });
  }

  @Post("carrier-rates")
  @Permissions("supply-chain.freight.manage")
  @TrackChanges("CarrierRate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a carrier rate card" })
  createCarrierRate(@Req() req: AuthRequest, @ZodBody(z.object({ carrierId: z.string(), serviceLevelId: z.string().optional(), originZip: z.string().optional(), destZip: z.string().optional(), originRegion: z.string().optional(), destRegion: z.string().optional(), weightMin: z.number().optional(), weightMax: z.number().optional(), rateType: z.string().optional(), baseRate: z.number().positive(), perUnitRate: z.number().optional(), perWeightRate: z.number().optional(), perDistanceRate: z.number().optional(), fuelSurcharge: z.number().optional(), minimumCharge: z.number().optional(), maximumCharge: z.number().optional(), currency: z.string().optional(), effectiveDate: z.string(), expirationDate: z.string().optional(), transitDays: z.number().int().optional() })) body: any) {
    return this.logiSvc.createCarrierRate(req.user.tenantId, body);
  }

  @Get("load-builds")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "List load builds with pagination" })
  listLoadBuilds(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.logiSvc.getLoadBuilds(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status });
  }

  @Get("load-builds/:id")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "Get load build by id" })
  getLoadBuild(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logiSvc.getLoadBuildById(req.user.tenantId, id);
  }

  @Post("load-builds")
  @Permissions("supply-chain.freight.create")
  @TrackChanges("LoadBuild")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a load build with stops and items" })
  createLoadBuild(@Req() req: AuthRequest, @ZodBody(createLoadBuildSchema) body: z.infer<typeof createLoadBuildSchema>) {
    return this.logiSvc.createLoadBuild(req.user.tenantId, body, req.user.userId);
  }

  @Patch("load-builds/:id/status")
  @Permissions("supply-chain.freight.update")
  @TrackChanges("LoadBuild", "id")
  @ApiOperation({ summary: "Update load build status" })
  updateLoadBuildStatus(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ status: z.string() })) body: { status: string }) {
    return this.logiSvc.updateLoadBuildStatus(req.user.tenantId, id, body.status);
  }

  @Post("load-builds/:loadId/tenders")
  @Permissions("supply-chain.freight.create")
  @TrackChanges("LoadTenderRequest")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a tender request for a load build" })
  createTender(@Req() req: AuthRequest, @Param("loadId") loadId: string, @ZodBody(z.object({ carrierId: z.string().optional(), carrierName: z.string().optional(), requestedRate: z.number().optional(), validUntil: z.string().optional(), notes: z.string().optional() })) body: any) {
    return this.logiSvc.createTenderRequest(req.user.tenantId, loadId, body);
  }

  @Get("appointments")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "List dock appointments" })
  listAppointments(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string, @Query("warehouseId") warehouseId?: string) {
    return this.logiSvc.getAppointments(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status, warehouseId });
  }

  @Post("appointments")
  @Permissions("supply-chain.freight.create")
  @TrackChanges("AppointmentSchedule")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Schedule a dock appointment" })
  createAppointment(@Req() req: AuthRequest, @ZodBody(createAppointmentSchema) body: z.infer<typeof createAppointmentSchema>) {
    return this.logiSvc.createAppointment(req.user.tenantId, body, req.user.userId);
  }

  @Patch("appointments/:id/status")
  @Permissions("supply-chain.freight.update")
  @TrackChanges("AppointmentSchedule", "id")
  @ApiOperation({ summary: "Update appointment status (check-in, progress, complete)" })
  updateAppointmentStatus(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ status: z.string() })) body: { status: string }) {
    return this.logiSvc.updateAppointmentStatus(req.user.tenantId, id, body.status);
  }

  @Post("delivery-confirmations")
  @Permissions("supply-chain.freight.create")
  @TrackChanges("DeliveryConfirmation")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record a delivery confirmation (POD)" })
  createPod(@Req() req: AuthRequest, @ZodBody(createPodSchema) body: z.infer<typeof createPodSchema>) {
    return this.logiSvc.createDeliveryConfirmation(req.user.tenantId, body, req.user.userId);
  }

  @Get("delivery-confirmations")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "List delivery confirmations" })
  listPods(@Req() req: AuthRequest, @Query("shipmentId") shipmentId?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.logiSvc.getDeliveryConfirmations(req.user.tenantId, { shipmentId, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  }

  @Get("rate-shop")
  @Permissions("supply-chain.freight.read")
  @ApiOperation({ summary: "Rate shop across carriers based on origin/dest/weight" })
  rateShop(@Req() req: AuthRequest, @Query("originZip") originZip?: string, @Query("destZip") destZip?: string, @Query("weight") weight?: string, @Query("pallets") pallets?: string) {
    return this.logiSvc.rateShop(req.user.tenantId, { originZip, destZip, weight: weight ? Number(weight) : undefined, pallets: pallets ? Number(pallets) : undefined });
  }
}
