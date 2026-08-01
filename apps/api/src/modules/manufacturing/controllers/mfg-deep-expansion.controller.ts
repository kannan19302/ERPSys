import { Controller, Get, Post, Body, Param, Headers } from "@nestjs/common";
import { MfgDeepExpansionService } from "../services/mfg-deep-expansion.service";

const TenantId = () => Headers("x-tenant-id");

@Controller("manufacturing/deep-expansion")
export class MfgDeepExpansionController {
  constructor(private readonly mfgService: MfgDeepExpansionService) {}

  // 1. MPS
  @Post("mps")
  createMps(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMps(tenantId, data);
  }

  @Get("mps")
  getMpsSchedules(@TenantId() tenantId: string) {
    return this.mfgService.getMpsSchedules(tenantId);
  }

  // 2. FMEA
  @Post("fmea")
  createFmeaRecord(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createFmeaRecord(tenantId, data);
  }

  @Get("fmea")
  getFmeaRecords(@TenantId() tenantId: string) {
    return this.mfgService.getFmeaRecords(tenantId);
  }

  // 3. SPC Control Charts
  @Post("spc/charts")
  createSpcChart(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createSpcChart(tenantId, data);
  }

  @Post("spc/charts/:id/telemetry")
  recordSpcDataPoint(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.mfgService.recordSpcDataPoint(tenantId, id, data);
  }

  // 4. Job Costing
  @Post("job-cost-sheets")
  createJobCostSheet(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createJobCostSheet(tenantId, data);
  }

  @Post("job-cost-sheets/:id/entries")
  addMfgCostEntry(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.mfgService.addMfgCostEntry(tenantId, id, data);
  }

  // 5. Formulas & Process Manufacturing
  @Post("formulas")
  createProductionFormula(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createProductionFormula(tenantId, data);
  }

  @Get("formulas")
  getProductionFormulas(@TenantId() tenantId: string) {
    return this.mfgService.getProductionFormulas(tenantId);
  }

  // 6. Machine & OEE
  @Post("machines")
  createMachine(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMachine(tenantId, data);
  }

  @Get("machines")
  getMachines(@TenantId() tenantId: string) {
    return this.mfgService.getMachines(tenantId);
  }

  @Post("machines/:id/oee")
  recordOee(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.mfgService.recordOee(tenantId, id, data);
  }

  // 7. Maintenance & CMMS
  @Post("maintenance/schedules")
  createMaintenanceSchedule(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMaintenanceSchedule(tenantId, data);
  }

  @Post("maintenance/work-orders")
  createMaintenanceWorkOrder(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createMaintenanceWorkOrder(tenantId, data);
  }

  // 8. Six Sigma DMAIC
  @Post("six-sigma/projects")
  createSixSigmaProject(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createSixSigmaProject(tenantId, data);
  }

  // 9. Shop Floor Barcode Transactions
  @Post("shop-floor/transactions")
  recordShopFloorTransaction(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.recordShopFloorTransaction(tenantId, data);
  }

  // 10. GMP / HACCP Compliance
  @Post("gmp/batch-records")
  createGmpBatchRecord(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createGmpBatchRecord(tenantId, data);
  }

  @Post("haccp/plans")
  createHacppPlan(@TenantId() tenantId: string, @Body() data: any) {
    return this.mfgService.createHacppPlan(tenantId, data);
  }
}
