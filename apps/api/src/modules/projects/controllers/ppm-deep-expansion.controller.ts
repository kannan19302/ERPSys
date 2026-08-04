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
import { PpmDeepExpansionService } from "../services/ppm-deep-expansion.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { CurrentTenant } from "../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../common/decorators/permissions.decorator";

// `TenantId` used to be `Headers("x-tenant-id")` — the tenant was whatever the
// caller claimed. It is now the session's tenant; the parameter sites below are
// unchanged because the alias is what moved.
const TenantId = CurrentTenant;

@Controller("projects/deep-expansion")
// These routes were reachable with no authentication at all, and took the
// tenant from a client-supplied `x-tenant-id` header — so any anonymous caller
// could read or write any tenant's data by naming it. The services behind them
// are real (letters of credit, production orders, project financials), not
// stubs. JwtAuthGuard now establishes the caller and `TenantId` resolves from
// the authenticated session instead of the request header.
@UseGuards(JwtAuthGuard, RbacGuard)
export class PpmDeepExpansionController {
  constructor(private readonly ppmService: PpmDeepExpansionService) {}

  // 1. Portfolios
  @Post("portfolios")
  @Permissions("projects.portfolio.create")
  createPortfolio(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createPortfolio(tenantId, data);
  }

  @Get("portfolios")
  @Permissions("projects.portfolio.read")
  getPortfolios(@TenantId() tenantId: string) {
    return this.ppmService.getPortfolios(tenantId);
  }

  // 2. Risk & Issues
  @Post("risks")
  @Permissions("projects.risk.create")
  createRiskRegister(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createRiskRegister(tenantId, data);
  }

  @Get("risks")
  @Permissions("projects.risk.read")
  getRiskRegisters(
    @TenantId() tenantId: string,
    @Query("projectId") projectId: string,
  ) {
    return this.ppmService.getRiskRegisters(tenantId, projectId);
  }

  @Post("issues")
  @Permissions("projects.issue.create")
  createIssueLog(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createIssueLog(tenantId, data);
  }

  // 3. EVM
  @Post("evm/baselines")
  @Permissions("projects.evm.create")
  createEvmBaseline(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createEvmBaseline(tenantId, data);
  }

  @Post("evm/baselines/:id/measurements")
  @Permissions("projects.evm.create")
  recordEvmMeasurement(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.ppmService.recordEvmMeasurement(tenantId, id, data);
  }

  // 4. Kanban
  @Post("kanban/boards")
  @Permissions("projects.kanban.create")
  createKanbanBoard(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createKanbanBoard(tenantId, data);
  }

  @Get("kanban/boards")
  @Permissions("projects.kanban.read")
  getKanbanBoards(
    @TenantId() tenantId: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.ppmService.getKanbanBoards(tenantId, projectId);
  }

  @Post("kanban/columns/:id/cards")
  @Permissions("projects.kanban.create")
  createKanbanCard(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.ppmService.createKanbanCard(tenantId, id, data);
  }

  // 5. Change Management
  @Post("change-requests")
  @Permissions("projects.change-request.create")
  createChangeRequest(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createChangeRequest(tenantId, data);
  }

  @Get("change-requests")
  @Permissions("projects.change-request.read")
  getChangeRequests(
    @TenantId() tenantId: string,
    @Query("projectId") projectId: string,
  ) {
    return this.ppmService.getChangeRequests(tenantId, projectId);
  }

  // 6. Timesheets
  @Post("timesheets")
  @Permissions("projects.timesheet.create")
  createTimesheet(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createTimesheet(tenantId, data);
  }

  @Get("timesheets")
  @Permissions("projects.timesheet.read")
  getTimesheets(
    @TenantId() tenantId: string,
    @Query("userId") userId?: string,
  ) {
    return this.ppmService.getTimesheets(tenantId, userId);
  }

  // 7. Subcontractors
  @Post("subcontractors")
  @Permissions("projects.subcontractor.create")
  createSubcontractor(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createSubcontractor(tenantId, data);
  }

  // 8. Quality Plans
  @Post("quality-plans")
  @Permissions("projects.quality-plan.create")
  createQualityPlan(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createQualityPlan(tenantId, data);
  }

  // 9. Benefits Realization
  @Post("benefits")
  @Permissions("projects.benefit.create")
  createProjectBenefit(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createProjectBenefit(tenantId, data);
  }

  // 10. Client Approvals
  @Post("client-approvals")
  @Permissions("projects.client-approval.create")
  createClientApproval(@TenantId() tenantId: string, @Body() data: any) {
    return this.ppmService.createClientApproval(tenantId, data);
  }
}
