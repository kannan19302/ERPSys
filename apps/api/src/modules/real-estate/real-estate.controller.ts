import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RealEstatePropertiesService } from "./real-estate-properties.service";
import { RealEstateLeasingService } from "./real-estate-leasing.service";
import { RealEstateOperationsService } from "./real-estate-operations.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string };
}

@Controller("ext/real-estate")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RealEstateController {
  constructor(
    private readonly props: RealEstatePropertiesService,
    private readonly leasing: RealEstateLeasingService,
    private readonly ops: RealEstateOperationsService,
  ) {}

  // ── Properties ──
  @Get("properties")
  @Permissions("real-estate.properties.read")
  async getProperties(@Req() req: AuthRequest, @Query() query: any) {
    return this.props.getProperties(req.user.tenantId, query);
  }
  @Get("properties/stats")
  @Permissions("real-estate.properties.read")
  async getPropertyStats(@Req() req: AuthRequest) {
    return this.props.getPropertyStats(req.user.tenantId);
  }
  @Get("properties/map")
  @Permissions("real-estate.properties.read")
  async getMapData(@Req() req: AuthRequest) {
    return this.props.getPropertyMapData(req.user.tenantId);
  }
  @Get("properties/:id")
  @Permissions("real-estate.properties.read")
  async getProperty(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.getPropertyById(req.user.tenantId, id);
  }
  @Post("properties")
  @Permissions("real-estate.properties.create")
  async createProperty(@Req() req: AuthRequest, @Body() body: any) {
    return this.props.createProperty(req.user.tenantId, body);
  }
  @Put("properties/:id")
  @Permissions("real-estate.properties.update")
  async updateProperty(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.props.updateProperty(req.user.tenantId, id, body);
  }
  @Delete("properties/:id")
  @Permissions("real-estate.properties.delete")
  async deleteProperty(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.deleteProperty(req.user.tenantId, id);
  }
  @Post("properties/bulk-update")
  @Permissions("real-estate.properties.update")
  async bulkUpdateProperties(@Req() req: AuthRequest, @Body() body: any) {
    return this.props.bulkUpdateProperties(
      req.user.tenantId,
      body.ids,
      body.data,
    );
  }

  // ── Portfolios ──
  @Get("portfolios")
  @Permissions("real-estate.portfolios.read")
  async getPortfolios(@Req() req: AuthRequest, @Query() query: any) {
    return this.props.getPortfolios(req.user.tenantId, query);
  }
  @Get("portfolios/:id")
  @Permissions("real-estate.portfolios.read")
  async getPortfolio(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.getPortfolioById(req.user.tenantId, id);
  }
  @Get("portfolios/:id/analytics")
  @Permissions("real-estate.portfolios.read")
  async getPortfolioAnalytics(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    return this.props.getPortfolioAnalytics(req.user.tenantId, id);
  }
  @Post("portfolios")
  @Permissions("real-estate.portfolios.create")
  async createPortfolio(@Req() req: AuthRequest, @Body() body: any) {
    return this.props.createPortfolio(req.user.tenantId, body);
  }
  @Put("portfolios/:id")
  @Permissions("real-estate.portfolios.update")
  async updatePortfolio(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.props.updatePortfolio(req.user.tenantId, id, body);
  }
  @Delete("portfolios/:id")
  @Permissions("real-estate.portfolios.delete")
  async deletePortfolio(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.deletePortfolio(req.user.tenantId, id);
  }

  // ── Buildings ──
  @Get("buildings")
  @Permissions("real-estate.buildings.read")
  async getBuildings(@Req() req: AuthRequest) {
    return this.props.getBuildings(req.user.tenantId);
  }
  @Get("buildings/:id")
  @Permissions("real-estate.buildings.read")
  async getBuilding(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.getBuildingById(req.user.tenantId, id);
  }
  @Post("buildings")
  @Permissions("real-estate.buildings.create")
  async createBuilding(@Req() req: AuthRequest, @Body() body: any) {
    return this.props.createBuilding(req.user.tenantId, body);
  }
  @Put("buildings/:id")
  @Permissions("real-estate.buildings.update")
  async updateBuilding(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.props.updateBuilding(req.user.tenantId, id, body);
  }
  @Delete("buildings/:id")
  @Permissions("real-estate.buildings.delete")
  async deleteBuilding(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.deleteBuilding(req.user.tenantId, id);
  }

  // ── Units ──
  @Get("units")
  @Permissions("real-estate.units.read")
  async getUnits(@Req() req: AuthRequest, @Query() query: any) {
    return this.props.getUnits(req.user.tenantId, query);
  }
  @Get("units/availability")
  @Permissions("real-estate.units.read")
  async getUnitAvailability(
    @Req() req: AuthRequest,
    @Query("propertyId") propertyId?: string,
  ) {
    return this.props.getUnitAvailability(req.user.tenantId, propertyId);
  }
  @Get("units/:id")
  @Permissions("real-estate.units.read")
  async getUnit(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.getUnitById(req.user.tenantId, id);
  }
  @Post("units")
  @Permissions("real-estate.units.create")
  async createUnit(@Req() req: AuthRequest, @Body() body: any) {
    return this.props.createUnit(req.user.tenantId, body);
  }
  @Put("units/:id")
  @Permissions("real-estate.units.update")
  async updateUnit(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.props.updateUnit(req.user.tenantId, id, body);
  }
  @Delete("units/:id")
  @Permissions("real-estate.units.delete")
  async deleteUnit(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.props.deleteUnit(req.user.tenantId, id);
  }
  @Post("units/bulk-update")
  @Permissions("real-estate.units.update")
  async bulkUpdateUnits(@Req() req: AuthRequest, @Body() body: any) {
    return this.props.bulkUpdateUnits(req.user.tenantId, body.ids, body.data);
  }

  // ── Leases ──
  @Get("leases")
  @Permissions("real-estate.leases.read")
  async getLeases(@Req() req: AuthRequest, @Query() query: any) {
    return this.leasing.getLeases(req.user.tenantId, query);
  }
  @Get("leases/stats")
  @Permissions("real-estate.leases.read")
  async getLeaseStats(@Req() req: AuthRequest) {
    return this.leasing.getLeaseStats(req.user.tenantId);
  }
  @Get("leases/expiring")
  @Permissions("real-estate.leases.read")
  async getExpiringLeases(
    @Req() req: AuthRequest,
    @Query("days") days?: string,
  ) {
    return this.leasing.getExpiringLeases(
      req.user.tenantId,
      days ? parseInt(days) : 30,
    );
  }
  @Get("leases/renewals")
  @Permissions("real-estate.leases.read")
  async getUpcomingRenewals(
    @Req() req: AuthRequest,
    @Query("days") days?: string,
  ) {
    return this.leasing.getUpcomingRenewals(
      req.user.tenantId,
      days ? parseInt(days) : 60,
    );
  }
  @Get("leases/:id")
  @Permissions("real-estate.leases.read")
  async getLease(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.leasing.getLeaseById(req.user.tenantId, id);
  }
  @Post("leases")
  @Permissions("real-estate.leases.create")
  async createLease(@Req() req: AuthRequest, @Body() body: any) {
    return this.leasing.createLease(req.user.tenantId, body);
  }
  @Put("leases/:id")
  @Permissions("real-estate.leases.update")
  async updateLease(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.leasing.updateLease(req.user.tenantId, id, body);
  }
  @Delete("leases/:id")
  @Permissions("real-estate.leases.delete")
  async deleteLease(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.leasing.deleteLease(req.user.tenantId, id);
  }
  @Post("leases/:id/renew")
  @Permissions("real-estate.leases.create")
  async renewLease(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.leasing.renewLease(req.user.tenantId, id, body);
  }
  @Post("leases/:id/terminate")
  @Permissions("real-estate.leases.update")
  async terminateLease(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.leasing.terminateLease(req.user.tenantId, id, body);
  }

  // ── Lease Payments ──
  @Get("payments")
  @Permissions("real-estate.payments.read")
  async getPayments(@Req() req: AuthRequest, @Query() query: any) {
    return this.leasing.getPayments(req.user.tenantId, query);
  }
  @Get("payments/stats")
  @Permissions("real-estate.payments.read")
  async getPaymentStats(@Req() req: AuthRequest) {
    return this.leasing.getPaymentStats(req.user.tenantId);
  }
  @Get("payments/:id")
  @Permissions("real-estate.payments.read")
  async getPayment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.leasing.getPaymentById(req.user.tenantId, id);
  }
  @Post("payments")
  @Permissions("real-estate.payments.create")
  async generateInvoice(@Req() req: AuthRequest, @Body() body: any) {
    return this.leasing.generateInvoice(
      req.user.tenantId,
      body.leaseId,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }
  @Patch("payments/:id/record")
  @Permissions("real-estate.payments.update")
  async recordPayment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.leasing.recordPayment(req.user.tenantId, id, body);
  }

  // ── Tenants ──
  @Get("tenants")
  @Permissions("real-estate.tenants.read")
  async getTenants(@Req() req: AuthRequest, @Query() query: any) {
    return this.leasing.getTenants(req.user.tenantId, query);
  }
  @Get("tenants/:id")
  @Permissions("real-estate.tenants.read")
  async getTenant(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.leasing.getTenantById(req.user.tenantId, id);
  }
  @Post("tenants")
  @Permissions("real-estate.tenants.create")
  async createTenant(@Req() req: AuthRequest, @Body() body: any) {
    return this.leasing.createTenant(req.user.tenantId, body);
  }
  @Put("tenants/:id")
  @Permissions("real-estate.tenants.update")
  async updateTenant(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.leasing.updateTenant(req.user.tenantId, id, body);
  }
  @Delete("tenants/:id")
  @Permissions("real-estate.tenants.delete")
  async deleteTenant(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.leasing.deleteTenant(req.user.tenantId, id);
  }

  // ── Maintenance ──
  @Get("maintenance")
  @Permissions("real-estate.maintenance.read")
  async getWorkOrders(@Req() req: AuthRequest, @Query() query: any) {
    return this.ops.getWorkOrders(req.user.tenantId, query);
  }
  @Get("maintenance/stats")
  @Permissions("real-estate.maintenance.read")
  async getMaintenanceStats(@Req() req: AuthRequest) {
    return this.ops.getMaintenanceStats(req.user.tenantId);
  }
  @Get("maintenance/:id")
  @Permissions("real-estate.maintenance.read")
  async getWorkOrder(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.getWorkOrderById(req.user.tenantId, id);
  }
  @Post("maintenance")
  @Permissions("real-estate.maintenance.create")
  async createWorkOrder(@Req() req: AuthRequest, @Body() body: any) {
    return this.ops.createWorkOrder(req.user.tenantId, body);
  }
  @Put("maintenance/:id")
  @Permissions("real-estate.maintenance.update")
  async updateWorkOrder(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.updateWorkOrder(req.user.tenantId, id, body);
  }
  @Delete("maintenance/:id")
  @Permissions("real-estate.maintenance.update")
  async deleteWorkOrder(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.deleteWorkOrder(req.user.tenantId, id);
  }
  @Post("maintenance/:id/assign")
  @Permissions("real-estate.maintenance.update")
  async assignWorkOrder(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.assignWorkOrder(req.user.tenantId, id, body.vendorId);
  }
  @Post("maintenance/bulk-update")
  @Permissions("real-estate.maintenance.update")
  async batchUpdateWorkOrders(@Req() req: AuthRequest, @Body() body: any) {
    return this.ops.batchUpdateWorkOrders(
      req.user.tenantId,
      body.ids,
      body.data,
    );
  }

  // ── Vendors ──
  @Get("vendors")
  @Permissions("real-estate.vendors.read")
  async getVendors(@Req() req: AuthRequest) {
    return this.ops.getVendors(req.user.tenantId);
  }
  @Get("vendors/:id")
  @Permissions("real-estate.vendors.read")
  async getVendor(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.getVendorById(req.user.tenantId, id);
  }
  @Post("vendors")
  @Permissions("real-estate.vendors.create")
  async createVendor(@Req() req: AuthRequest, @Body() body: any) {
    return this.ops.createVendor(req.user.tenantId, body);
  }
  @Put("vendors/:id")
  @Permissions("real-estate.vendors.update")
  async updateVendor(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.updateVendor(req.user.tenantId, id, body);
  }
  @Delete("vendors/:id")
  @Permissions("real-estate.vendors.delete")
  async deleteVendor(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.deleteVendor(req.user.tenantId, id);
  }

  // ── Commissions ──
  @Get("commission-plans")
  @Permissions("real-estate.commissions.read")
  async getCommissionPlans(@Req() req: AuthRequest) {
    return this.ops.getCommissionPlans(req.user.tenantId);
  }
  @Get("commission-plans/:id")
  @Permissions("real-estate.commissions.read")
  async getCommissionPlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.getCommissionPlanById(req.user.tenantId, id);
  }
  @Post("commission-plans")
  @Permissions("real-estate.commissions.create")
  async createCommissionPlan(@Req() req: AuthRequest, @Body() body: any) {
    return this.ops.createCommissionPlan(req.user.tenantId, body);
  }
  @Put("commission-plans/:id")
  @Permissions("real-estate.commissions.update")
  async updateCommissionPlan(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.updateCommissionPlan(req.user.tenantId, id, body);
  }
  @Delete("commission-plans/:id")
  @Permissions("real-estate.commissions.delete")
  async deleteCommissionPlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.deleteCommissionPlan(req.user.tenantId, id);
  }
  @Get("commissions")
  @Permissions("real-estate.commissions.read")
  async getCommissionPayouts(@Req() req: AuthRequest, @Query() query: any) {
    return this.ops.getCommissionPayouts(req.user.tenantId, query);
  }
  @Get("commissions/stats")
  @Permissions("real-estate.commissions.read")
  async getCommissionStats(@Req() req: AuthRequest) {
    return this.ops.getCommissionStats(req.user.tenantId);
  }
  @Get("commissions/:id")
  @Permissions("real-estate.commissions.read")
  async getCommissionPayout(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.getCommissionPayoutById(req.user.tenantId, id);
  }
  @Post("commissions")
  @Permissions("real-estate.commissions.create")
  async createCommissionPayout(@Req() req: AuthRequest, @Body() body: any) {
    return this.ops.createCommissionPayout(req.user.tenantId, body);
  }
  @Put("commissions/:id")
  @Permissions("real-estate.commissions.update")
  async updateCommissionPayout(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.updateCommissionPayout(req.user.tenantId, id, body);
  }
  @Post("commissions/:id/approve")
  @Permissions("real-estate.commissions.update")
  async approveCommissionPayout(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    return this.ops.approveCommissionPayout(req.user.tenantId, id);
  }
  @Post("commissions/:id/pay")
  @Permissions("real-estate.commissions.update")
  async processCommissionPayment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.processCommissionPayment(req.user.tenantId, id, body);
  }

  // ── Valuations ──
  @Get("valuations")
  @Permissions("real-estate.valuations.read")
  async getValuations(@Req() req: AuthRequest, @Query() query: any) {
    return this.ops.getValuations(req.user.tenantId, query);
  }
  @Get("valuations/latest/:propertyId")
  @Permissions("real-estate.valuations.read")
  async getLatestValuation(
    @Req() req: AuthRequest,
    @Param("propertyId") propertyId: string,
  ) {
    return this.ops.getLatestValuation(req.user.tenantId, propertyId);
  }
  @Get("valuations/compare/:propertyId")
  @Permissions("real-estate.valuations.read")
  async compareValuations(
    @Req() req: AuthRequest,
    @Param("propertyId") propertyId: string,
  ) {
    return this.ops.compareValuations(req.user.tenantId, propertyId);
  }
  @Get("valuations/market-analytics")
  @Permissions("real-estate.valuations.read")
  async getMarketAnalytics(@Req() req: AuthRequest) {
    return this.ops.getMarketAnalytics(req.user.tenantId);
  }
  @Get("valuations/:id")
  @Permissions("real-estate.valuations.read")
  async getValuation(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.getValuationById(req.user.tenantId, id);
  }
  @Post("valuations")
  @Permissions("real-estate.valuations.create")
  async createValuation(@Req() req: AuthRequest, @Body() body: any) {
    return this.ops.createValuation(req.user.tenantId, body);
  }
  @Put("valuations/:id")
  @Permissions("real-estate.valuations.update")
  async updateValuation(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.updateValuation(req.user.tenantId, id, body);
  }
  @Delete("valuations/:id")
  @Permissions("real-estate.valuations.delete")
  async deleteValuation(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ops.deleteValuation(req.user.tenantId, id);
  }
}
