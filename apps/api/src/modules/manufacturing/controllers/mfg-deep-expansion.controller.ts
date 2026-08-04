import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
} from "@nestjs/common";
import { MfgDeepExpansionService } from "../services/mfg-deep-expansion.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { CurrentTenant } from "../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../common/decorators/permissions.decorator";

// `TenantId` used to be `Headers("x-tenant-id")` — the tenant was whatever the
// caller claimed. It is now the session's tenant; the parameter sites below are
// unchanged because the alias is what moved.
const TenantId = CurrentTenant;

@Controller("manufacturing/deep-expansion")
// These routes were reachable with no authentication at all, and took the
// tenant from a client-supplied `x-tenant-id` header — so any anonymous caller
// could read or write any tenant's data by naming it. The services behind them
// are real (letters of credit, production orders, project financials), not
// stubs. JwtAuthGuard now establishes the caller and `TenantId` resolves from
// the authenticated session instead of the request header.
@UseGuards(JwtAuthGuard, RbacGuard)
export class MfgDeepExpansionController {
  constructor(private readonly mfgService: MfgDeepExpansionService) {}

  // 1. MPS
  @Post("mps")
  @Permissions("manufacturing.mp.create")
  createMps(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMps(tenantId, data);
  }

  @Get("mps")
  @Permissions("manufacturing.mp.read")
  getMpsSchedules(@TenantId() tenantId: string) {
    return this.mfgService.getMpsSchedules(tenantId);
  }

  // 2. FMEA
  @Post("fmea")
  @Permissions("manufacturing.fmea.create")
  createFmeaRecord(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createFmeaRecord(tenantId, data);
  }

  @Get("fmea")
  @Permissions("manufacturing.fmea.read")
  getFmeaRecords(@TenantId() tenantId: string) {
    return this.mfgService.getFmeaRecords(tenantId);
  }

  // 3. SPC Control Charts
  @Post("spc/charts")
  @Permissions("manufacturing.spc.create")
  createSpcChart(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createSpcChart(tenantId, data);
  }

  @Post("spc/charts/:id/telemetry")
  @Permissions("manufacturing.spc.create")
  recordSpcDataPoint(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.mfgService.recordSpcDataPoint(tenantId, id, data);
  }

  // 4. Job Costing
  @Post("job-cost-sheets")
  @Permissions("manufacturing.job-cost-sheet.create")
  createJobCostSheet(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createJobCostSheet(tenantId, data);
  }

  @Post("job-cost-sheets/:id/entries")
  @Permissions("manufacturing.job-cost-sheet.create")
  addMfgCostEntry(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.mfgService.addMfgCostEntry(tenantId, id, data);
  }

  // 5. Formulas & Process Manufacturing
  @Post("formulas")
  @Permissions("manufacturing.formula.create")
  createProductionFormula(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createProductionFormula(tenantId, data);
  }

  @Get("formulas")
  @Permissions("manufacturing.formula.read")
  getProductionFormulas(@TenantId() tenantId: string) {
    return this.mfgService.getProductionFormulas(tenantId);
  }

  // 6. Machine & OEE
  @Post("machines")
  @Permissions("manufacturing.machine.create")
  createMachine(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMachine(tenantId, data);
  }

  @Get("machines")
  @Permissions("manufacturing.machine.read")
  getMachines(@TenantId() tenantId: string) {
    return this.mfgService.getMachines(tenantId);
  }

  @Post("machines/:id/oee")
  @Permissions("manufacturing.machine.create")
  recordOee(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.mfgService.recordOee(tenantId, id, data);
  }

  // 7. Maintenance & CMMS
  @Post("maintenance/schedules")
  @Permissions("manufacturing.maintenance.create")
  createMaintenanceSchedule(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMaintenanceSchedule(tenantId, data);
  }

  @Post("maintenance/work-orders")
  @Permissions("manufacturing.maintenance.create")
  createMaintenanceWorkOrder(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMaintenanceWorkOrder(tenantId, data);
  }

  // 8. Six Sigma DMAIC
  @Post("six-sigma/projects")
  @Permissions("manufacturing.six-sigma.create")
  createSixSigmaProject(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createSixSigmaProject(tenantId, data);
  }

  // 9. Shop Floor Barcode Transactions
  @Post("shop-floor/transactions")
  @Permissions("manufacturing.shop-floor.create")
  recordShopFloorTransaction(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.recordShopFloorTransaction(tenantId, data);
  }

  // 10. GMP / HACCP Compliance
  @Post("gmp/batch-records")
  @Permissions("manufacturing.gmp.create")
  createGmpBatchRecord(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createGmpBatchRecord(tenantId, data);
  }

  @Post("haccp/plans")
  @Permissions("manufacturing.haccp.create")
  createHacppPlan(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createHacppPlan(tenantId, data);
  }
}
