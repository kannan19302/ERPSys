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
import { SupplyChainFleetService } from "../services/supply-chain-fleet.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const registerSchema = z.object({
  vehicleNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  vehicleType: z.string().min(1),
  capacityKg: z.number().optional(),
  capacityM3: z.number().optional(),
  fuelType: z.string().min(1),
  licensePlate: z.string().min(1),
  vin: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  registrationExpiry: z.string().optional(),
  status: z.string().optional(),
  assignedDriverId: z.string().optional(),
});
const updateVehicleSchema = registerSchema.partial();
const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  maintenanceType: z.string().min(1),
  description: z.string().min(1),
  scheduledDate: z.string(),
  estimatedCost: z.number().optional(),
  odometerReading: z.number().optional(),
  vendorName: z.string().optional(),
  notes: z.string().optional(),
});
const completeMaintSchema = z.object({
  completedDate: z.string().min(1),
  actualCost: z.number().optional(),
  workDone: z.string().optional(),
});
const fuelSchema = z.object({
  vehicleId: z.string().min(1),
  fuelDate: z.string(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  odometerReading: z.number().optional(),
  fuelType: z.string().optional(),
  stationName: z.string().optional(),
  driverId: z.string().optional(),
});
const tripSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  startTime: z.string(),
  endTime: z.string().optional(),
  distanceKm: z.number().optional(),
  tripType: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

@ApiTags("supply-chain / fleet")
@ApiBearerAuth()
@Controller("supply-chain/fleet")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FleetManagementController {
  constructor(private readonly svc: SupplyChainFleetService) {}

  @Get("dashboard")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "Fleet management dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getFleetDashboard(req.user.tenantId);
  }

  @Get("utilization")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "Fleet utilization metrics" })
  getUtilization(@Req() req: AuthRequest) {
    return this.svc.getFleetUtilization(req.user.tenantId);
  }

  @Get("maintenance/forecast")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "Maintenance forecast" })
  getMaintenanceForecast(
    @Req() req: AuthRequest,
    @Query("months") months?: string,
  ) {
    return this.svc.getMaintenanceForecast(
      req.user.tenantId,
      months ? Number(months) : 6,
    );
  }

  @Get("drivers/performance")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "Driver performance metrics" })
  getDriverPerformance(
    @Req() req: AuthRequest,
    @Query("driverId") driverId?: string,
  ) {
    return this.svc.getDriverPerformance(req.user.tenantId, driverId);
  }

  @Get("vehicles")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "List vehicles" })
  listVehicles(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("vehicleType") vehicleType?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.svc.listVehicles(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      vehicleType,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });
  }

  @Get("vehicles/:id")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "Get vehicle detail" })
  getVehicle(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getVehicle(req.user.tenantId, id);
  }

  @Post("vehicles")
  @Permissions("supply-chain.fleet.create")
  @ApiOperation({ summary: "Register new vehicle" })
  @HttpCode(HttpStatus.CREATED)
  registerVehicle(
    @Req() req: AuthRequest,
    @ZodBody(registerSchema) body: z.infer<typeof registerSchema>,
  ) {
    return this.svc.registerVehicle(
      req.user.tenantId,
      req.user.orgId ?? "",
      body,
    );
  }

  @Patch("vehicles/:id")
  @Permissions("supply-chain.fleet.update")
  @ApiOperation({ summary: "Update vehicle" })
  updateVehicle(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateVehicleSchema) body: z.infer<typeof updateVehicleSchema>,
  ) {
    return this.svc.updateVehicle(req.user.tenantId, id, body as any);
  }

  @Post("maintenance")
  @Permissions("supply-chain.fleet.create")
  @ApiOperation({ summary: "Schedule maintenance" })
  @HttpCode(HttpStatus.CREATED)
  scheduleMaintenance(
    @Req() req: AuthRequest,
    @ZodBody(maintenanceSchema) body: z.infer<typeof maintenanceSchema>,
  ) {
    return this.svc.scheduleMaintenance(req.user.tenantId, body);
  }

  @Get("maintenance")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "List maintenance records" })
  listMaintenance(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("vehicleId") vehicleId?: string,
  ) {
    return this.svc.listMaintenance(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      vehicleId,
    });
  }

  @Patch("maintenance/:id/complete")
  @Permissions("supply-chain.fleet.update")
  @ApiOperation({ summary: "Complete maintenance" })
  completeMaintenance(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(completeMaintSchema) body: z.infer<typeof completeMaintSchema>,
  ) {
    return this.svc.completeMaintenance(req.user.tenantId, id, body);
  }

  @Post("fuel")
  @Permissions("supply-chain.fleet.create")
  @ApiOperation({ summary: "Log fuel entry" })
  @HttpCode(HttpStatus.CREATED)
  logFuel(
    @Req() req: AuthRequest,
    @ZodBody(fuelSchema) body: z.infer<typeof fuelSchema>,
  ) {
    return this.svc.logFuelEntry(req.user.tenantId, body);
  }

  @Get("fuel")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "List fuel logs" })
  listFuel(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("vehicleId") vehicleId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.listFuelLogs(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      vehicleId,
      startDate,
      endDate,
    });
  }

  @Post("trips")
  @Permissions("supply-chain.fleet.create")
  @ApiOperation({ summary: "Record trip" })
  @HttpCode(HttpStatus.CREATED)
  recordTrip(
    @Req() req: AuthRequest,
    @ZodBody(tripSchema) body: z.infer<typeof tripSchema>,
  ) {
    return this.svc.recordTrip(req.user.tenantId, body);
  }

  @Get("trips")
  @Permissions("supply-chain.fleet.read")
  @ApiOperation({ summary: "List trips" })
  listTrips(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("vehicleId") vehicleId?: string,
    @Query("driverId") driverId?: string,
  ) {
    return this.svc.listTrips(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      vehicleId,
      driverId,
    });
  }
}
