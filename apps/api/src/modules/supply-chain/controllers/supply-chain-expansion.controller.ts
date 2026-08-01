import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../../common/interceptors/change-history.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FreightManagementService } from "../services/freight-management.service";
import { SupplierCollaborationService } from "../services/supplier-collaboration.service";
import { SupplyNetworkRiskService } from "../services/supply-network-risk.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

// ─── Schemas ─────────────────────────────────────────────────────────

const createFreightOrderSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  shipmentDate: z.string().optional(),
  freightCost: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  carrierId: z.string().optional(),
  notes: z.string().optional(),
});

const updateFreightStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "BOOKED",
    "DISPATCHED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
});

const assignCarrierSchema = z.object({
  carrierId: z.string().min(1),
  carrierName: z.string().min(1),
});

const addFreightRateSchema = z.object({
  carrierId: z.string().min(1),
  carrierName: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  baseRate: z.number().positive(),
  ratePerKm: z.number().positive().optional(),
  ratePerKg: z.number().positive().optional(),
  currency: z.string().optional(),
  effectiveFrom: z.string(),
  transitDays: z.number().int().positive().optional(),
});

const addTrackingEventSchema = z.object({
  location: z.string().min(1),
  status: z.string().min(1),
  description: z.string().min(1),
});

const acknowledgePoSchema = z.object({});
const shipPoSchema = z.object({
  shipmentDate: z.string(),
  expectedDelivery: z.string(),
  trackingNumber: z.string().optional(),
  carrierName: z.string().optional(),
  notes: z.string().optional(),
});

const submitInvoiceSchema = z.object({
  vendorId: z.string().min(1),
  purchaseOrderId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const createCollaborationSchema = z.object({
  supplierId: z.string().min(1),
  subject: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  initialMessage: z.string().optional(),
});

const postMessageSchema = z.object({
  content: z.string().min(1),
  isSupplier: z.boolean().optional(),
});

const reportRiskEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum([
    "SUPPLIER_DISRUPTION",
    "LOGISTICS",
    "GEOPOLITICAL",
    "DEMAND_SHOCK",
    "QUALITY",
    "CAPACITY",
    "NATURAL_DISASTER",
    "OTHER",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  affectedSupplierId: z.string().optional(),
  estimatedImpact: z.number().nonnegative().optional(),
  currency: z.string().optional(),
});

const updateRiskStatusSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "MITIGATED", "RESOLVED", "CLOSED"]),
});

const addNetworkNodeSchema = z.object({
  type: z.enum([
    "PLANT",
    "DISTRIBUTION_CENTER",
    "SUPPLIER",
    "CUSTOMER",
    "PORT",
    "WAREHOUSE",
  ]),
  name: z.string().min(1),
  location: z.string().min(1),
  country: z.string().min(1),
  capacity: z.number().int().positive().optional(),
});

// ─── Freight Management Controller ──────────────────────────────────

@ApiTags("supply-chain / freight")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class FreightManagementController {
  constructor(private readonly freightSvc: FreightManagementService) {}

  @ApiOperation({ summary: "List freight orders with pagination and filters" })
  @Get("freight-orders")
  @Permissions("supply-chain.freight.read")
  listFreightOrders(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("carrierId") carrierId?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.freightSvc.listFreightOrders(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      carrierId,
      sortBy,
      sortOrder,
    });
  }

  @ApiOperation({ summary: "Create a new freight order" })
  @Post("freight-orders")
  @Permissions("supply-chain.freight.create")
  @TrackChanges("FreightOrder")
  @HttpCode(HttpStatus.CREATED)
  createFreightOrder(
    @Req() req: AuthRequest,
    @ZodBody(createFreightOrderSchema)
    body: z.infer<typeof createFreightOrderSchema>,
  ) {
    return this.freightSvc.createFreightOrder(
      req.user.tenantId,
      req.user.orgId ?? "default",
      body,
    );
  }

  @ApiOperation({ summary: "Get freight order detail by id" })
  @Get("freight-orders/:id")
  @Permissions("supply-chain.freight.read")
  getFreightOrder(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.freightSvc.getFreightOrder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Update freight order status" })
  @Patch("freight-orders/:id/status")
  @Permissions("supply-chain.freight.update")
  @TrackChanges("FreightOrder", "id")
  updateFreightStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateFreightStatusSchema)
    body: z.infer<typeof updateFreightStatusSchema>,
  ) {
    return this.freightSvc.updateFreightOrderStatus(
      req.user.tenantId,
      id,
      body.status,
    );
  }

  @ApiOperation({ summary: "Assign a carrier to a freight order" })
  @Post("freight-orders/:id/assign-carrier")
  @Permissions("supply-chain.freight.update")
  @TrackChanges("FreightOrder", "id")
  assignCarrier(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(assignCarrierSchema) body: z.infer<typeof assignCarrierSchema>,
  ) {
    return this.freightSvc.assignCarrier(
      req.user.tenantId,
      id,
      body.carrierId,
      body.carrierName,
    );
  }

  @ApiOperation({ summary: "Get freight rate cards" })
  @Get("freight-rates")
  @Permissions("supply-chain.freight.read")
  getFreightRates(@Req() req: AuthRequest) {
    return this.freightSvc.getFreightRates(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add or update a freight rate" })
  @Post("freight-rates")
  @Permissions("supply-chain.freight.manage")
  @TrackChanges("FreightRate")
  @HttpCode(HttpStatus.CREATED)
  addFreightRate(
    @Req() req: AuthRequest,
    @ZodBody(addFreightRateSchema) body: z.infer<typeof addFreightRateSchema>,
  ) {
    return this.freightSvc.addFreightRate(req.user.tenantId, body);
  }

  @ApiOperation({
    summary: "Get freight cost analytics (cost/km, carrier performance)",
  })
  @Get("freight-analytics")
  @Permissions("supply-chain.freight.read")
  getFreightAnalytics(@Req() req: AuthRequest) {
    return this.freightSvc.getFreightAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add a tracking event to a freight order" })
  @Post("freight-orders/:id/track")
  @Permissions("supply-chain.freight.update")
  @TrackChanges("TrackingEvent")
  @HttpCode(HttpStatus.CREATED)
  addTrackingEvent(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(addTrackingEventSchema)
    body: z.infer<typeof addTrackingEventSchema>,
  ) {
    return this.freightSvc.addTrackingEvent(req.user.tenantId, id, {
      ...body,
      recordedBy: req.user.userId,
    });
  }

  @ApiOperation({ summary: "Get tracking timeline for a freight order" })
  @Get("freight-orders/:id/tracking")
  @Permissions("supply-chain.freight.read")
  getTrackingTimeline(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.freightSvc.getTrackingTimeline(req.user.tenantId, id);
  }
}

// ─── Supplier Collaboration Controller ──────────────────────────────

@ApiTags("supply-chain / supplier-portal")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class SupplierCollaborationController {
  constructor(private readonly collabSvc: SupplierCollaborationService) {}

  @ApiOperation({
    summary: "Supplier portal: list purchase orders assigned to suppliers",
  })
  @Get("supplier-portal/orders")
  @Permissions("supply-chain.supplier.read")
  getSupplierOrders(
    @Req() req: AuthRequest,
    @Query("vendorId") vendorId?: string,
  ) {
    return this.collabSvc.getSupplierPurchaseOrders(
      req.user.tenantId,
      vendorId,
    );
  }

  @ApiOperation({ summary: "Supplier acknowledges a purchase order" })
  @Post("supplier-portal/orders/:id/acknowledge")
  @Permissions("supply-chain.supplier.update")
  @TrackChanges("PurchaseOrder", "id")
  acknowledgeOrder(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(acknowledgePoSchema) _body: Record<string, never>,
  ) {
    return this.collabSvc.acknowledgePurchaseOrder(req.user.tenantId, id);
  }

  @ApiOperation({
    summary: "Supplier submits an advance shipping notice (ASN)",
  })
  @Post("supplier-portal/orders/:id/ship")
  @Permissions("supply-chain.supplier.update")
  @TrackChanges("AdvanceShippingNotice", "id")
  @HttpCode(HttpStatus.CREATED)
  submitAsn(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(shipPoSchema) body: z.infer<typeof shipPoSchema>,
  ) {
    return this.collabSvc.submitAdvanceShippingNotice(
      req.user.tenantId,
      id,
      body,
    );
  }

  @ApiOperation({ summary: "Supplier portal: list invoices" })
  @Get("supplier-portal/invoices")
  @Permissions("supply-chain.supplier.read")
  getSupplierInvoices(
    @Req() req: AuthRequest,
    @Query("vendorId") vendorId?: string,
  ) {
    return this.collabSvc.getSupplierInvoices(req.user.tenantId, vendorId);
  }

  @ApiOperation({ summary: "Supplier submits an invoice" })
  @Post("supplier-portal/invoices")
  @Permissions("supply-chain.supplier.create")
  @TrackChanges("VendorBill")
  @HttpCode(HttpStatus.CREATED)
  submitInvoice(
    @Req() req: AuthRequest,
    @ZodBody(submitInvoiceSchema) body: z.infer<typeof submitInvoiceSchema>,
  ) {
    return this.collabSvc.submitSupplierInvoice(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get supplier performance scorecards" })
  @Get("supplier-scorecards")
  @Permissions("supply-chain.supplier.read")
  getSupplierScorecards(@Req() req: AuthRequest) {
    return this.collabSvc.getSupplierScorecards(req.user.tenantId);
  }

  @ApiOperation({ summary: "Trigger a supplier scorecard evaluation" })
  @Post("supplier-scorecards/:supplierId/evaluate")
  @Permissions("supply-chain.supplier.manage")
  @TrackChanges("SupplierScorecard", "supplierId")
  evaluateScorecard(
    @Req() req: AuthRequest,
    @Param("supplierId") supplierId: string,
  ) {
    return this.collabSvc.evaluateSupplierScorecard(
      req.user.tenantId,
      supplierId,
    );
  }

  @ApiOperation({ summary: "List supplier collaboration threads" })
  @Get("supplier-collaborations")
  @Permissions("supply-chain.supplier.read")
  listThreads(@Req() req: AuthRequest) {
    return this.collabSvc.getCollaborationThreads(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create a new supplier collaboration thread" })
  @Post("supplier-collaborations")
  @Permissions("supply-chain.supplier.create")
  @TrackChanges("CollaborationThread")
  @HttpCode(HttpStatus.CREATED)
  createThread(
    @Req() req: AuthRequest,
    @ZodBody(createCollaborationSchema)
    body: z.infer<typeof createCollaborationSchema>,
  ) {
    return this.collabSvc.createCollaborationThread(req.user.tenantId, {
      ...body,
      initialMessage: body.initialMessage ?? "",
      authorId: req.user.userId,
      authorName: req.user.email,
    });
  }

  @ApiOperation({ summary: "Post a message to a collaboration thread" })
  @Post("supplier-collaborations/:id/message")
  @Permissions("supply-chain.supplier.update")
  @HttpCode(HttpStatus.CREATED)
  postMessage(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(postMessageSchema) body: z.infer<typeof postMessageSchema>,
  ) {
    return this.collabSvc.postThreadMessage(req.user.tenantId, id, {
      content: body.content,
      authorId: req.user.userId,
      authorName: req.user.email,
      isSupplier: body.isSupplier ?? false,
    });
  }
}

// ─── Supply Network & Risk Controller ───────────────────────────────

@ApiTags("supply-chain / risk")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class SupplyNetworkRiskController {
  constructor(private readonly riskSvc: SupplyNetworkRiskService) {}

  @ApiOperation({ summary: "List supply chain risk events" })
  @Get("risk-events")
  @Permissions("supply-chain.risk.read")
  listRiskEvents(@Req() req: AuthRequest) {
    return this.riskSvc.listRiskEvents(req.user.tenantId);
  }

  @ApiOperation({ summary: "Report a new supply chain risk event" })
  @Post("risk-events")
  @Permissions("supply-chain.risk.create")
  @TrackChanges("SupplyRiskEvent")
  @HttpCode(HttpStatus.CREATED)
  reportRiskEvent(
    @Req() req: AuthRequest,
    @ZodBody(reportRiskEventSchema) body: z.infer<typeof reportRiskEventSchema>,
  ) {
    return this.riskSvc.reportRiskEvent(req.user.tenantId, {
      ...body,
      reportedBy: req.user.userId,
    });
  }

  @ApiOperation({ summary: "Update supply risk event status" })
  @Patch("risk-events/:id")
  @Permissions("supply-chain.risk.update")
  @TrackChanges("SupplyRiskEvent", "id")
  updateRiskStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateRiskStatusSchema)
    body: z.infer<typeof updateRiskStatusSchema>,
  ) {
    return this.riskSvc.updateRiskEventStatus(
      req.user.tenantId,
      id,
      body.status,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "Calculate supply impact of a risk event" })
  @Get("risk-events/:id/impact")
  @Permissions("supply-chain.risk.read")
  getRiskImpact(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.riskSvc.getRiskImpact(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get supply network topology (nodes and edges)" })
  @Get("network-map")
  @Permissions("supply-chain.network.read")
  getNetworkMap(@Req() req: AuthRequest) {
    return this.riskSvc.getNetworkMap(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add a node to the supply network map" })
  @Post("network-map/nodes")
  @Permissions("supply-chain.network.manage")
  @TrackChanges("NetworkNode")
  @HttpCode(HttpStatus.CREATED)
  addNetworkNode(
    @Req() req: AuthRequest,
    @ZodBody(addNetworkNodeSchema) body: z.infer<typeof addNetworkNodeSchema>,
  ) {
    return this.riskSvc.addNetworkNode(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get active supply chain disruption alerts" })
  @Get("disruption-alerts")
  @Permissions("supply-chain.risk.read")
  getDisruptionAlerts(@Req() req: AuthRequest) {
    return this.riskSvc.getDisruptionAlerts(req.user.tenantId);
  }

  @ApiOperation({ summary: "Acknowledge a disruption alert" })
  @Post("disruption-alerts/:id/acknowledge")
  @Permissions("supply-chain.risk.update")
  @TrackChanges("DisruptionAlert", "id")
  acknowledgeAlert(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.riskSvc.acknowledgeDisruptionAlert(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary:
      "Get supply resilience score and single-source dependency analysis",
  })
  @Get("supply-resilience")
  @Permissions("supply-chain.network.read")
  getSupplyResilience(@Req() req: AuthRequest) {
    return this.riskSvc.getSupplyResilience(req.user.tenantId);
  }

  @ApiOperation({
    summary: "Get alternative supplier recommendations for a given supplier",
  })
  @Get("alternative-sources")
  @Permissions("supply-chain.network.read")
  getAlternativeSources(
    @Req() req: AuthRequest,
    @Query("supplierId") supplierId?: string,
  ) {
    return this.riskSvc.getAlternativeSuppliers(req.user.tenantId, supplierId);
  }
}
