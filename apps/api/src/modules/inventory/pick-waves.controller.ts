import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { PickWavesService } from "./pick-waves.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

interface AuthRequest {
  user: { tenantId: string; userId: string };
}

@UseGuards(JwtAuthGuard)
@Controller("inventory/pick-waves")
export class PickWavesController {
  constructor(private readonly svc: PickWavesService) {}

  @Permissions("inventory.wave.create")
  @Post()
  createWave(
    @Request() req: AuthRequest,
    @Body() body: { warehouseId: string; orgId?: string; notes?: string },
  ) {
    return this.svc.createWave(req.user.tenantId, req.user.userId, body);
  }

  @Permissions("inventory.order-to-wave.create")
  @Post(":id/orders")
  addOrder(
    @Request() req: AuthRequest,
    @Param("id") id: string,
    @Body("salesOrderId") salesOrderId: string,
  ) {
    return this.svc.addOrderToWave(req.user.tenantId, id, salesOrderId);
  }

  @Permissions("inventory.item-to-wave.create")
  @Post(":id/items")
  addItem(
    @Request() req: AuthRequest,
    @Param("id") id: string,
    @Body()
    body: { productId: string; quantity: number; binLocationId?: string },
  ) {
    return this.svc.addItemToWave(req.user.tenantId, id, body);
  }

  @Permissions("inventory.wave.start")
  @Patch(":id/start")
  startWave(@Request() req: AuthRequest, @Param("id") id: string) {
    return this.svc.startWave(req.user.tenantId, id);
  }

  @Permissions("inventory.pick.confirm")
  @Patch(":id/items/:itemId/pick")
  confirmPick(
    @Request() req: AuthRequest,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body("pickedQty") pickedQty: number,
  ) {
    return this.svc.confirmPick(
      req.user.tenantId,
      req.user.userId,
      id,
      itemId,
      pickedQty,
    );
  }

  @Permissions("inventory.wave.pack")
  @Patch(":id/pack")
  packWave(@Request() req: AuthRequest, @Param("id") id: string) {
    return this.svc.packWave(req.user.tenantId, id);
  }

  @Permissions("inventory.wave.complete")
  @Patch(":id/complete")
  completeWave(@Request() req: AuthRequest, @Param("id") id: string) {
    return this.svc.completeWave(req.user.tenantId, id);
  }

  @Permissions("inventory.wave.cancel")
  @Patch(":id/cancel")
  cancelWave(@Request() req: AuthRequest, @Param("id") id: string) {
    return this.svc.cancelWave(req.user.tenantId, id);
  }

  @Permissions("inventory.task.assign")
  @Post("tasks")
  assignTask(
    @Request() req: AuthRequest,
    @Body()
    body: {
      pickWaveId: string;
      pickItemId: string;
      assignedTo: string;
      binLocation?: string;
      instructionNote?: string;
    },
  ) {
    return this.svc.assignTask(req.user.tenantId, body);
  }

  @Permissions("inventory.task.start")
  @Patch("tasks/:taskId/start")
  startTask(@Request() req: AuthRequest, @Param("taskId") taskId: string) {
    return this.svc.startTask(req.user.tenantId, taskId);
  }

  @Permissions("inventory.task-for-picker.read")
  @Get("tasks/picker")
  getTasksForPicker(
    @Request() req: AuthRequest,
    @Query("assignedTo") assignedTo: string,
    @Query("waveId") waveId?: string,
  ) {
    return this.svc.getTasksForPicker(req.user.tenantId, assignedTo, waveId);
  }

  @Permissions("inventory.dashboard.read")
  @Get("dashboard")
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Permissions("inventory.wave.read")
  @Get()
  listWaves(
    @Request() req: AuthRequest,
    @Query("status") status?: string,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.svc.listWaves(req.user.tenantId, status, warehouseId);
  }

  @Permissions("inventory.wave.read")
  @Get(":id")
  getWave(@Request() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getWave(req.user.tenantId, id);
  }
}
