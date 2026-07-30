// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from "@nestjs/common";
import { PpmDeepExpansionService } from "../services/ppm-deep-expansion.service";

const TenantId = () => Headers("x-tenant-id");

@Controller("projects/deep-expansion")
export class PpmDeepExpansionController {
  constructor(private readonly ppmService: PpmDeepExpansionService) {}

  // 1. Portfolios
  @Post("portfolios")
  createPortfolio(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createPortfolio(tenantId, data);
  }

  @Get("portfolios")
  getPortfolios(@TenantId() tenantId: string) {
    return this.ppmService.getPortfolios(tenantId);
  }

  // 2. Risk & Issues
  @Post("risks")
  createRiskRegister(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createRiskRegister(tenantId, data);
  }

  @Get("risks")
  getRiskRegisters(
    @TenantId() tenantId: string,
    @Query("projectId") projectId: string,
  ) {
    return this.ppmService.getRiskRegisters(tenantId, projectId);
  }

  @Post("issues")
  createIssueLog(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createIssueLog(tenantId, data);
  }

  // 3. EVM
  @Post("evm/baselines")
  createEvmBaseline(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createEvmBaseline(tenantId, data);
  }

  @Post("evm/baselines/:id/measurements")
  recordEvmMeasurement(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.ppmService.recordEvmMeasurement(tenantId, id, data);
  }

  // 4. Kanban
  @Post("kanban/boards")
  createKanbanBoard(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createKanbanBoard(tenantId, data);
  }

  @Get("kanban/boards")
  getKanbanBoards(
    @TenantId() tenantId: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.ppmService.getKanbanBoards(tenantId, projectId);
  }

  @Post("kanban/columns/:id/cards")
  createKanbanCard(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.ppmService.createKanbanCard(tenantId, id, data);
  }

  // 5. Change Management
  @Post("change-requests")
  createChangeRequest(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createChangeRequest(tenantId, data);
  }

  @Get("change-requests")
  getChangeRequests(
    @TenantId() tenantId: string,
    @Query("projectId") projectId: string,
  ) {
    return this.ppmService.getChangeRequests(tenantId, projectId);
  }

  // 6. Timesheets
  @Post("timesheets")
  createTimesheet(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createTimesheet(tenantId, data);
  }

  @Get("timesheets")
  getTimesheets(
    @TenantId() tenantId: string,
    @Query("userId") userId?: string,
  ) {
    return this.ppmService.getTimesheets(tenantId, userId);
  }

  // 7. Subcontractors
  @Post("subcontractors")
  createSubcontractor(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createSubcontractor(tenantId, data);
  }

  // 8. Quality Plans
  @Post("quality-plans")
  createQualityPlan(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createQualityPlan(tenantId, data);
  }

  // 9. Benefits Realization
  @Post("benefits")
  createProjectBenefit(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createProjectBenefit(tenantId, data);
  }

  // 10. Client Approvals
  @Post("client-approvals")
  createClientApproval(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createClientApproval(tenantId, data);
  }
}
