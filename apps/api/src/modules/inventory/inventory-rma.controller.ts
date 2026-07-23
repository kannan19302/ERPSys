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
import { InventoryRmaService } from "./inventory-rma.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createRmaSchema = z.object({
  rmaNumber: z.string().min(1), source: z.enum(["CUSTOMER_RETURN", "VENDOR_RETURN", "INTERNAL", "QUALITY"]),
  customerId: z.string().optional(), customerName: z.string().optional(),
  vendorId: z.string().optional(), vendorName: z.string().optional(),
  salesOrderId: z.string().optional(), salesOrderNumber: z.string().optional(),
  purchaseOrderId: z.string().optional(), returnReason: z.string().optional(),
  returnType: z.string().optional(), priority: z.string().optional(),
  warehouseId: z.string().optional(), notes: z.string().optional(),
  lines: z.array(z.object({ productId: z.string().optional(), productSku: z.string().optional(), productName: z.string().optional(), expectedQty: z.number().positive(), uom: z.string().optional(), lotNumber: z.string().optional(), serialNumbers: z.string().optional(), unitValue: z.number().optional() })).optional(),
});

const receiveRmaSchema = z.object({
  lines: z.array(z.object({ lineId: z.string(), receivedQty: z.number().nonnegative().optional(), condition: z.string().optional() })),
});

const inspectRmaSchema = z.object({
  inspectorId: z.string().optional(), result: z.enum(["PASS", "FAIL", "PARTIAL"]),
  overallCondition: z.string().optional(), defects: z.any().optional(), notes: z.string().optional(),
  lines: z.array(z.object({ lineId: z.string(), disposition: z.string().optional(), acceptedQty: z.number().nonnegative().optional(), rejectedQty: z.number().nonnegative().optional(), condition: z.string().optional() })),
});

@ApiTags("inventory / rma")
@ApiBearerAuth()
@Controller("inventory/rma")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class InventoryRmaController {
  constructor(private readonly rmaSvc: InventoryRmaService) {}

  @Get()
  @Permissions("inventory.rma.read")
  @ApiOperation({ summary: "List RMAs with pagination and filters" })
  list(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string, @Query("source") source?: string) {
    return this.rmaSvc.getRmas(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status, source });
  }

  @Get("analytics")
  @Permissions("inventory.rma.read")
  @ApiOperation({ summary: "RMA analytics by source, status, reason" })
  analytics(@Req() req: AuthRequest) {
    return this.rmaSvc.getRmaAnalytics(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("inventory.rma.read")
  @ApiOperation({ summary: "Get RMA by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.rmaSvc.getRmaById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("inventory.rma.create")
  @TrackChanges("RMA")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new RMA" })
  create(@Req() req: AuthRequest, @ZodBody(createRmaSchema) body: z.infer<typeof createRmaSchema>) {
    return this.rmaSvc.createRma(req.user.tenantId, body, req.user.userId);
  }

  @Patch(":id/status")
  @Permissions("inventory.rma.update")
  @TrackChanges("RMA", "id")
  @ApiOperation({ summary: "Update RMA status" })
  updateStatus(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ status: z.string() })) body: { status: string }) {
    return this.rmaSvc.updateRmaStatus(req.user.tenantId, id, body.status);
  }

  @Post(":id/receive")
  @Permissions("inventory.rma.update")
  @TrackChanges("RMA", "id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Receive RMA items" })
  receive(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(receiveRmaSchema) body: z.infer<typeof receiveRmaSchema>) {
    return this.rmaSvc.receiveRma(req.user.tenantId, id, body);
  }

  @Post(":id/inspect")
  @Permissions("inventory.rma.update")
  @TrackChanges("RMA", "id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Inspect received RMA and disposition items" })
  inspect(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(inspectRmaSchema) body: z.infer<typeof inspectRmaSchema>) {
    return this.rmaSvc.inspectRma(req.user.tenantId, id, body);
  }
}
