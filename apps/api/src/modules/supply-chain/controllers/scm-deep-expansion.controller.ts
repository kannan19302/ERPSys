import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from "@nestjs/common";
import { ScmDeepExpansionService } from "../services/scm-deep-expansion.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { CurrentTenant } from "../../../common/decorators/current-tenant.decorator";

// `TenantId` used to be `Headers("x-tenant-id")` — the tenant was whatever the
// caller claimed. It is now the session's tenant; the parameter sites below are
// unchanged because the alias is what moved.
const TenantId = CurrentTenant;

@Controller("supply-chain/deep-expansion")
// These routes were reachable with no authentication at all, and took the
// tenant from a client-supplied `x-tenant-id` header — so any anonymous caller
// could read or write any tenant's data by naming it. The services behind them
// are real (letters of credit, production orders, project financials), not
// stubs. JwtAuthGuard now establishes the caller and `TenantId` resolves from
// the authenticated session instead of the request header.
@UseGuards(JwtAuthGuard, RbacGuard)
export class ScmDeepExpansionController {
  constructor(private readonly scmService: ScmDeepExpansionService) {}

  // 1. Letters of Credit & Trade Finance
  @Post("letters-of-credit")
  createLetterOfCredit(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createLetterOfCredit(tenantId, data);
  }

  @Get("letters-of-credit")
  getLettersOfCredit(@TenantId() tenantId: string, @Query() filter?: any) {
    return this.scmService.getLettersOfCredit(tenantId, filter);
  }

  @Get("letters-of-credit/:id")
  getLetterOfCreditById(@TenantId() tenantId: string, @Param("id") id: string) {
    return this.scmService.getLetterOfCreditById(tenantId, id);
  }

  @Post("letters-of-credit/:id/documents")
  addLcDocument(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.addLcDocument(tenantId, id, data);
  }

  @Post("letters-of-credit/:id/amendments")
  addLcAmendment(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.addLcAmendment(tenantId, id, data);
  }

  @Post("letters-of-credit/:id/presentations")
  submitLcPresentation(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.submitLcPresentation(tenantId, id, data);
  }

  // 2. S&OP Cycle & Planning
  @Post("sop/cycles")
  createSopCycle(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createSopCycle(tenantId, data);
  }

  @Get("sop/cycles")
  getSopCycles(@TenantId() tenantId: string) {
    return this.scmService.getSopCycles(tenantId);
  }

  @Post("sop/cycles/:id/demand-plan")
  createSopDemandPlan(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.createSopDemandPlan(tenantId, id, data);
  }

  @Post("sop/cycles/:id/supply-plan")
  createSopSupplyPlan(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.createSopSupplyPlan(tenantId, id, data);
  }

  @Post("sop/cycles/:id/consensus-plan")
  createSopConsensusPlan(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.createSopConsensusPlan(tenantId, id, data);
  }

  // 3. 4PL/3PL Logistics Provider Management
  @Post("logistics-providers")
  createLogisticsProvider(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createLogisticsProvider(tenantId, data);
  }

  @Get("logistics-providers")
  getLogisticsProviders(@TenantId() tenantId: string) {
    return this.scmService.getLogisticsProviders(tenantId);
  }

  @Post("logistics-providers/:id/performance")
  logProviderPerformance(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.logProviderPerformance(tenantId, id, data);
  }

  // 4. Cold Chain Tracking & Excursions
  @Post("cold-chain/shipments")
  createColdChainShipment(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createColdChainShipment(tenantId, data);
  }

  @Get("cold-chain/shipments")
  getColdChainShipments(@TenantId() tenantId: string) {
    return this.scmService.getColdChainShipments(tenantId);
  }

  @Post("cold-chain/shipments/:id/telemetry")
  recordTemperatureLog(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.scmService.recordTemperatureLog(tenantId, id, data);
  }

  // 5. SCEM Alerts & Risk Events
  @Post("scem/alerts")
  createScemAlert(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createScemAlert(tenantId, data);
  }

  @Get("scem/alerts")
  getScemAlerts(
    @TenantId() tenantId: string,
    @Query("status") status?: string,
  ) {
    return this.scmService.getScemAlerts(tenantId, status);
  }

  @Post("risk-events")
  createSupplyChainRiskEvent(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createSupplyChainRiskEvent(tenantId, data);
  }

  // 6. Trade Compliance
  @Post("trade-compliance/check")
  performTradeComplianceCheck(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.performTradeComplianceCheck(tenantId, data);
  }

  @Post("trade-compliance/export-license")
  createExportLicense(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createExportLicense(tenantId, data);
  }

  // 7. Multi-Modal Transport
  @Post("multimodal-orders")
  createMultimodalOrder(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createMultimodalOrder(tenantId, data);
  }

  @Get("multimodal-orders")
  getMultimodalOrders(@TenantId() tenantId: string) {
    return this.scmService.getMultimodalOrders(tenantId);
  }

  // 8. Last-Mile Delivery
  @Post("delivery-zones")
  createDeliveryZone(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createDeliveryZone(tenantId, data);
  }

  @Post("last-mile-deliveries")
  createLastMileDelivery(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createLastMileDelivery(tenantId, data);
  }

  // 9. Reverse Logistics
  @Post("reverse-logistics")
  createReverseLogisticsOrder(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createReverseLogisticsOrder(tenantId, data);
  }

  // 10. Network Design
  @Post("network-designs")
  createNetworkDesign(@TenantId() tenantId: string, @Body() data: any) {
    return this.scmService.createNetworkDesign(tenantId, data);
  }
}
