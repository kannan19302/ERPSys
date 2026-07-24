import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InventoryWavePlanningService } from "./inventory-wave-planning.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createWavePlanSchema = z.object({
  warehouseId: z.string().optional(),
  planType: z.string().optional(),
  optimizationStrategy: z.string().optional(),
  sortMethod: z.string().optional(),
  notes: z.string().optional(),
  tasks: z.array(
    z.object({
      taskType: z.string(),
      sourceLocation: z.string().optional(),
      destLocation: z.string().optional(),
      productId: z.string().optional(),
      productSku: z.string().optional(),
      productName: z.string().optional(),
      quantity: z.number().positive(),
      uom: z.string().optional(),
      priority: z.number().int().optional(),
      orderRef: z.string().optional(),
    }),
  ),
});

const recordKpiSchema = z.object({
  warehouseId: z.string().optional(),
  kpiDate: z.string().optional(),
  linesPicked: z.number().int().optional(),
  linesPutaway: z.number().int().optional(),
  ordersShipped: z.number().int().optional(),
  ordersReceived: z.number().int().optional(),
  picksPerHour: z.number().optional(),
  putawayPerHour: z.number().optional(),
  orderAccuracyPct: z.number().optional(),
  totalLaborHours: z.number().optional(),
  activeWorkers: z.number().int().optional(),
  laborCostPerOrder: z.number().optional(),
});

const optimizeSafetyStockSchema = z.object({
  productId: z.string(),
  warehouseId: z.string().optional(),
  serviceLevel: z.number().min(0).max(1).optional(),
  leadTimeDays: z.number().int().optional(),
  holdingCostPct: z.number().optional(),
  stockoutCost: z.number().optional(),
  currentSafetyStock: z.number().int().optional(),
});

@ApiTags("inventory / wave-planning")
@ApiBearerAuth()
@Controller("inventory")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class InventoryWavePlanningController {
  constructor(private readonly waveSvc: InventoryWavePlanningService) {}

  @Get("wave-plans")
  @Permissions("inventory.wave-planning.read")
  @ApiOperation({ summary: "List wave plans with pagination" })
  listWavePlans(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.waveSvc.getWavePlans(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      warehouseId,
    });
  }

  @Get("wave-plans/:id")
  @Permissions("inventory.wave-planning.read")
  @ApiOperation({ summary: "Get wave plan by id" })
  getWavePlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.waveSvc.getWavePlanById(req.user.tenantId, id);
  }

  @Post("wave-plans")
  @Permissions("inventory.wave-planning.create")
  @TrackChanges("WavePlan")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a wave plan with tasks" })
  createWavePlan(
    @Req() req: AuthRequest,
    @ZodBody(createWavePlanSchema) body: z.infer<typeof createWavePlanSchema>,
  ) {
    return this.waveSvc.createWavePlan(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Post("wave-plans/:id/release")
  @Permissions("inventory.wave-planning.update")
  @TrackChanges("WavePlan", "id")
  @ApiOperation({ summary: "Release a wave plan for execution" })
  releaseWavePlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.waveSvc.releaseWavePlan(req.user.tenantId, id);
  }

  @Post("wave-plans/:id/complete")
  @Permissions("inventory.wave-planning.update")
  @TrackChanges("WavePlan", "id")
  @ApiOperation({ summary: "Mark wave plan as completed" })
  completeWavePlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.waveSvc.completeWavePlan(req.user.tenantId, id);
  }

  @Post("wave-plan-tasks/:taskId/assign")
  @Permissions("inventory.wave-planning.update")
  @TrackChanges("WavePlanTask", "taskId")
  @ApiOperation({ summary: "Assign a wave plan task to a worker" })
  assignTask(
    @Req() req: AuthRequest,
    @Param("taskId") taskId: string,
    @ZodBody(z.object({ assignee: z.string() })) body: { assignee: string },
  ) {
    return this.waveSvc.assignTask(req.user.tenantId, taskId, body.assignee);
  }

  @Post("wave-plan-tasks/:taskId/complete")
  @Permissions("inventory.wave-planning.update")
  @TrackChanges("WavePlanTask", "taskId")
  @ApiOperation({ summary: "Complete a wave plan task" })
  completeTask(
    @Req() req: AuthRequest,
    @Param("taskId") taskId: string,
    @Query("pickedQty") pickedQty?: string,
  ) {
    return this.waveSvc.completeTask(
      req.user.tenantId,
      taskId,
      pickedQty ? Number(pickedQty) : undefined,
    );
  }

  @Get("warehouse-kpis")
  @Permissions("inventory.warehouse-kpis.read")
  @ApiOperation({ summary: "Get warehouse KPIs" })
  getKpis(
    @Req() req: AuthRequest,
    @Query("warehouseId") warehouseId?: string,
    @Query("sinceDays") sinceDays?: string,
  ) {
    return this.waveSvc.getWarehouseKpis(
      req.user.tenantId,
      warehouseId,
      sinceDays ? Number(sinceDays) : undefined,
    );
  }

  @Post("warehouse-kpis")
  @Permissions("inventory.warehouse-kpis.create")
  @TrackChanges("WarehouseKpi")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record warehouse KPI snapshot" })
  recordKpi(
    @Req() req: AuthRequest,
    @ZodBody(recordKpiSchema) body: z.infer<typeof recordKpiSchema>,
  ) {
    return this.waveSvc.recordWarehouseKpi(req.user.tenantId, body);
  }

  @Get("safety-stock-optimizations")
  @Permissions("inventory.safety-stock.read")
  @ApiOperation({ summary: "List safety stock optimizations" })
  listSafetyStock(
    @Req() req: AuthRequest,
    @Query("productId") productId?: string,
  ) {
    return this.waveSvc.getSafetyStockOptimizations(
      req.user.tenantId,
      productId,
    );
  }

  @Post("safety-stock-optimizations")
  @Permissions("inventory.safety-stock.create")
  @TrackChanges("SafetyStockOptimization")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Run safety stock optimization for a product" })
  optimizeSafetyStock(
    @Req() req: AuthRequest,
    @ZodBody(optimizeSafetyStockSchema)
    body: z.infer<typeof optimizeSafetyStockSchema>,
  ) {
    return this.waveSvc.optimizeSafetyStock(req.user.tenantId, body);
  }

  @Get("global-inventory")
  @Permissions("inventory.global-inventory.read")
  @ApiOperation({ summary: "Get global inventory view across warehouses" })
  getGlobalInventory(
    @Req() req: AuthRequest,
    @Query("productId") productId?: string,
  ) {
    return this.waveSvc.getGlobalInventory(req.user.tenantId, productId);
  }
}
