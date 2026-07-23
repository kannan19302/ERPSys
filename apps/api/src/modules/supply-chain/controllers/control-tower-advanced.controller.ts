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
import { ControlTowerAdvancedService } from "../services/control-tower-advanced.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("supply-chain / control-tower")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class ControlTowerAdvancedController {
  constructor(private readonly towerSvc: ControlTowerAdvancedService) {}

  @Get("control-tower-events")
  @Permissions("supply-chain.dashboard.read")
  @ApiOperation({ summary: "List control tower events with pagination and filters" })
  listEvents(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string, @Query("severity") severity?: string, @Query("eventType") eventType?: string) {
    return this.towerSvc.getEvents(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status, severity, eventType });
  }

  @Get("control-tower-events/:id")
  @Permissions("supply-chain.dashboard.read")
  @ApiOperation({ summary: "Get control tower event by id" })
  getEvent(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.towerSvc.getEventById(req.user.tenantId, id);
  }

  @Post("control-tower-events")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerEvent")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a control tower event" })
  createEvent(@Req() req: AuthRequest, @ZodBody(z.object({ eventType: z.string(), severity: z.string().optional(), title: z.string(), description: z.string().optional(), category: z.string().optional(), sourceModule: z.string().optional(), sourceId: z.string().optional(), sourceType: z.string().optional(), assignedTo: z.string().optional(), impactScore: z.number().optional() })) body: any) {
    return this.towerSvc.createEvent(req.user.tenantId, body);
  }

  @Patch("control-tower-events/:id/status")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerEvent", "id")
  @ApiOperation({ summary: "Update control tower event status" })
  updateEventStatus(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ status: z.string() })) body: { status: string }) {
    return this.towerSvc.updateEventStatus(req.user.tenantId, id, body.status, req.user.userId);
  }

  @Post("control-tower-events/:id/assign")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerEvent", "id")
  @ApiOperation({ summary: "Assign a control tower event to a user" })
  assignEvent(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ assignedTo: z.string() })) body: { assignedTo: string }) {
    return this.towerSvc.assignEvent(req.user.tenantId, id, body.assignedTo);
  }

  @Post("control-tower-events/:eventId/actions")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerAction", "eventId")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Execute an action on a control tower event" })
  executeAction(@Req() req: AuthRequest, @Param("eventId") eventId: string, @ZodBody(z.object({ actionType: z.string(), description: z.string().optional() })) body: any) {
    return this.towerSvc.executeAction(req.user.tenantId, eventId, body.actionType, body.description, req.user.userId);
  }

  @Get("control-tower-kpis")
  @Permissions("supply-chain.dashboard.read")
  @ApiOperation({ summary: "List control tower KPIs" })
  listKpis(@Req() req: AuthRequest, @Query("category") category?: string, @Query("period") period?: string) {
    return this.towerSvc.getKpis(req.user.tenantId, { category, period });
  }

  @Post("control-tower-kpis")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerKpi")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a control tower KPI definition" })
  createKpi(@Req() req: AuthRequest, @ZodBody(z.object({ kpiName: z.string(), kpiCode: z.string(), category: z.string().optional(), currentValue: z.number().optional(), targetValue: z.number().optional(), unit: z.string().optional(), period: z.string().optional(), trend: z.string().optional() })) body: any) {
    return this.towerSvc.createKpi(req.user.tenantId, body);
  }

  @Patch("control-tower-kpis/:id/value")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerKpi", "id")
  @ApiOperation({ summary: "Update a KPI's current value" })
  updateKpiValue(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ currentValue: z.number() })) body: { currentValue: number }) {
    return this.towerSvc.updateKpiValue(req.user.tenantId, id, body.currentValue);
  }

  @Get("control-tower-alert-configs")
  @Permissions("supply-chain.dashboard.read")
  @ApiOperation({ summary: "List alert configurations" })
  listAlertConfigs(@Req() req: AuthRequest) {
    return this.towerSvc.getAlertConfigs(req.user.tenantId);
  }

  @Post("control-tower-alert-configs")
  @Permissions("supply-chain.dashboard.read")
  @TrackChanges("ControlTowerAlertConfig")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an alert configuration" })
  createAlertConfig(@Req() req: AuthRequest, @ZodBody(z.object({ alertName: z.string(), description: z.string().optional(), eventType: z.string().optional(), kpiCode: z.string().optional(), condition: z.any().optional(), severity: z.string().optional(), notificationChannels: z.any().optional(), recipients: z.any().optional(), autoResolve: z.boolean().optional() })) body: any) {
    return this.towerSvc.createAlertConfig(req.user.tenantId, body);
  }

  @Get("control-tower-dashboard")
  @Permissions("supply-chain.dashboard.read")
  @ApiOperation({ summary: "Get control tower aggregated dashboard data" })
  getDashboard(@Req() req: AuthRequest) {
    return this.towerSvc.getControlTowerDashboard(req.user.tenantId);
  }
}
