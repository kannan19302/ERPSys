import { Controller, Get, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RealEstateService } from "./real-estate.service";
import { Request } from "express";

interface AuthRequest extends Request { user: { tenantId: string; userId: string }; }

@Controller("ext/real-estate")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RealEstateController {
  constructor(private readonly svc: RealEstateService) {}

  // ── Properties ──
  @Get("properties")
  @Permissions("real-estate.properties.read")
  async getProperties(@Req() req: AuthRequest) { return this.svc.getProperties(req.user.tenantId); }

  @Get("properties/:id")
  @Permissions("real-estate.properties.read")
  async getProperty(@Req() req: AuthRequest, @Param("id") id: string) { return this.svc.getPropertyById(req.user.tenantId, id); }

  @Post("properties")
  @Permissions("real-estate.properties.create")
  async createProperty(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createProperty(req.user.tenantId, body); }

  // ── Leases ──
  @Get("leases")
  @Permissions("real-estate.leases.read")
  async getLeases(@Req() req: AuthRequest) { return this.svc.getLeases(req.user.tenantId); }

  @Get("leases/:id")
  @Permissions("real-estate.leases.read")
  async getLease(@Req() req: AuthRequest, @Param("id") id: string) { return this.svc.getLeaseById(req.user.tenantId, id); }

  @Post("leases")
  @Permissions("real-estate.leases.create")
  async createLease(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createLease(req.user.tenantId, body); }

  // ── Tenants ──
  @Get("tenants")
  @Permissions("real-estate.leases.read")
  async getTenants(@Req() req: AuthRequest) { return this.svc.getTenants(req.user.tenantId); }

  // ── Maintenance ──
  @Get("maintenances")
  @Permissions("real-estate.maintenance.read")
  async getMaintenances(@Req() req: AuthRequest) { return this.svc.getMaintenances(req.user.tenantId); }

  @Post("maintenances")
  @Permissions("real-estate.maintenance.create")
  async createMaintenance(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createMaintenance(req.user.tenantId, body); }

  // ── Commissions ──
  @Get("commissions")
  @Permissions("real-estate.commissions.read")
  async getCommissions(@Req() req: AuthRequest) { return this.svc.getCommissions(req.user.tenantId); }

  @Post("commissions")
  @Permissions("real-estate.commissions.create")
  async createCommission(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createCommission(req.user.tenantId, body); }
}
